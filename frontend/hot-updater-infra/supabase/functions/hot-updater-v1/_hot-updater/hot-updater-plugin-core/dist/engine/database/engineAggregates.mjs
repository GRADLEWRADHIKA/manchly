import { DatabaseTransactionError } from "../../serverPlugin/errors.mjs";
import { mergeDistinct } from "../../database/distinct.mjs";
import "../../database/adapter.mjs";
import { isKeyValue } from "../../database/values.mjs";
import { fnv1a } from "./cursor.mjs";
//#region src/engine/database/engineAggregates.ts
const definitionOf = (model) => model.definition;
/** Every change keyed by one value lands on one shard. */
const shardOf = (value, shards) => fnv1a(value) % shards;
/** Merges one `tx.aggregate` call into its shard row's pending changes. */
const recordAggregate = (changes, model, identity, values, shardBy) => {
	const { key: fields, counters, gauges, distinct, shards } = definitionOf(model);
	const fail = (message) => new DatabaseTransactionError(`${model.table.name}: ${message}`);
	if (Object.keys(identity).length !== fields.length || !fields.every((name) => isKeyValue(identity[name]))) throw fail(`aggregate takes exactly its identity fields: ${fields.join(", ")}.`);
	if (shardBy === void 0 && shards > 1 && gauges.some((gauge) => gauge in values)) throw fail("gauges of a sharded aggregate need shardBy.");
	const shard = shardBy === void 0 ? Math.floor(Math.random() * shards) : shardOf(shardBy, shards);
	const key = [...fields.map((name) => identity[name]), shard];
	const id = JSON.stringify([model.table.name, key]);
	const change = changes.get(id) ?? {
		model,
		key,
		deltas: {},
		sketches: {}
	};
	changes.set(id, change);
	for (const [metric, value] of Object.entries(values)) if (distinct.includes(metric) && typeof value === "string") change.sketches[metric] = mergeDistinct([change.sketches[metric], value]);
	else if ((counters.includes(metric) || gauges.includes(metric)) && Number.isSafeInteger(value)) change.deltas[metric] = (change.deltas[metric] ?? 0) + Number(value);
	else throw fail(`${metric} is not a counter, gauge, or sketch of this aggregate.`);
};
/** A shard row before its first change: every metric zero or empty. */
const blank = (model, key) => {
	const { counters, gauges, distinct } = definitionOf(model);
	return Object.fromEntries([
		...model.table.key.map((column, position) => [column, key[position]]),
		...[...counters, ...gauges].map((name) => [name, 0]),
		...distinct.map((name) => [name, null]),
		["_v", 0]
	]);
};
/**
* A gauge computed below zero. Deltas from a row another writer has since
* moved do this, so the transaction reruns; it is thrown only when it lasts.
*/
var NegativeGaugeError = class extends DatabaseTransactionError {};
/** The guarded write that merges `change` into `current`: insert, patch, or delete at zero. */
const rewrite = ({ model, key, deltas, sketches }, current) => {
	const { table } = model;
	const { counters, gauges, distinct } = definitionOf(model);
	const base = current ?? blank(model, key);
	const set = {};
	for (const [metric, delta] of Object.entries(deltas)) set[metric] = Number(base[metric] ?? 0) + delta;
	for (const [metric, sketch] of Object.entries(sketches)) set[metric] = mergeDistinct([base[metric], sketch]);
	if (current && Object.entries(set).every(([metric, value]) => current[metric] === value)) return;
	const row = {
		...base,
		...set
	};
	if (gauges.some((gauge) => Number(row[gauge]) < 0)) {
		if (current === null && table.retention) return void 0;
		throw new NegativeGaugeError(`${table.name}: a gauge went below 0.`);
	}
	const zero = distinct.length === 0 && [...counters, ...gauges].every((metric) => Number(row[metric]) === 0);
	if (current === null) return zero ? void 0 : {
		type: "insert",
		table,
		row
	};
	const guard = { v: Number(current["_v"]) };
	return zero ? {
		type: "delete",
		table,
		key,
		guard,
		previous: current
	} : {
		type: "patch",
		table,
		key,
		set,
		guard,
		previous: current
	};
};
/**
* Counter-only rows become blind increments that create the row when it is
* missing. Rows with gauges or sketches are read in one parallel batch per
* table, merged, and written back under a guard, so a conflict resends only
* them.
*/
const compileAggregates = async (adapter, changes) => {
	const ops = [];
	const merged = /* @__PURE__ */ new Map();
	for (const change of changes) {
		const { model, key, deltas, sketches } = change;
		if (Object.keys(sketches).length > 0 || definitionOf(model).gauges.some((gauge) => (deltas[gauge] ?? 0) !== 0)) merged.set(model, [...merged.get(model) ?? [], change]);
		else if (Object.values(deltas).some((delta) => delta !== 0)) {
			const { table } = model;
			const init = blank(model, key);
			ops.push({
				type: "increment",
				table,
				key,
				by: deltas,
				init
			});
		}
	}
	const groups = [...merged.values()];
	const current = await Promise.all(groups.map((group) => adapter.get(group[0].model.table, group.map(({ key }) => key))));
	groups.forEach((group, index) => group.forEach((change, position) => {
		const op = rewrite(change, current[index][position] ?? null);
		if (op !== void 0) ops.push(op);
	}));
	return ops;
};
//#endregion
export { NegativeGaugeError, compileAggregates, recordAggregate, shardOf };
