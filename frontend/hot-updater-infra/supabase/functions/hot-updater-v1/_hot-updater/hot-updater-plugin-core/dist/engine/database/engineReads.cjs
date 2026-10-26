const require_errors = require("../../serverPlugin/errors.cjs");
const require_distinct = require("../../database/distinct.cjs");
const require_adapter = require("../../database/adapter.cjs");
const require_values = require("../../database/values.cjs");
const require_cursor = require("./cursor.cjs");
const require_resolveSchema = require("./resolveSchema.cjs");
//#region src/engine/database/engineReads.ts
const sameFields = (left, right) => left.length === right.length && left.every((field) => right.includes(field));
const keyValue = (value, field) => {
	if (require_values.isKeyValue(value)) return value;
	throw new require_errors.DatabaseQueryError(`${field} needs a string, number, or boolean.`);
};
const bound = (exclusive, inclusive, columns) => {
	if (exclusive !== void 0 && inclusive !== void 0) throw new require_errors.DatabaseQueryError(`range on ${columns[0]} sets both bounds of one side.`);
	const value = exclusive ?? inclusive;
	if (value === void 0) return void 0;
	const values = Array.isArray(value) ? value : [value];
	if (values.length === 0 || values.length > columns.length) throw new require_errors.DatabaseQueryError(`range on ${columns[0]} takes 1–${columns.length} values of ${columns.join(", ")}.`);
	return {
		values: values.map((item, position) => keyValue(item, columns[position])),
		inclusive: inclusive !== void 0
	};
};
const createEngineReads = ({ adapter, schema, maxPageSize: requested = 500 }) => {
	const maxPageSize = Math.min(requested, 500);
	let count = {
		calls: 0,
		rows: 0
	};
	const returned = (rows) => {
		const size = Array.isArray(rows) ? rows.length : rows === null ? 0 : 1;
		count = {
			calls: count.calls + 1,
			rows: count.rows + size
		};
		return rows;
	};
	/** A model of `kind` by physical table name, for reads and transactions. */
	const modelOf = (name, kind = "table") => {
		const model = schema.models.get(name);
		if (model?.definition.kind === kind) return model;
		throw new require_errors.DatabaseQueryError(model === void 0 ? `Unknown model ${name}.` : kind === "table" ? `${name} is an aggregate; read it with findAggregates and change it with aggregate.` : `${name} is a table; read it with findMany and change it with create, update, or delete.`);
	};
	const plan = ({ table }, input) => {
		const index = table.indexes.find(({ name }) => name === input.index);
		if (index === void 0) throw new require_errors.DatabaseQueryError(`${table.name} has no index ${input.index}.`);
		const where = input.where ?? {};
		if (!sameFields(Object.keys(where), index.eq)) throw new require_errors.DatabaseQueryError(`${table.name}.${index.name} reads need where on exactly: ${index.eq.join(", ") || "(none)"}.`);
		const { limit, order = "asc", range } = input;
		if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxPageSize) throw new require_errors.DatabaseQueryError(`limit must be 1–${maxPageSize}.`);
		const columns = require_adapter.indexOrderColumns(table, index);
		const eq = index.eq.map((field) => keyValue(where[field], `${table.name}.${field}`));
		const scope = require_cursor.cursorScope([
			table.name,
			index.name,
			eq,
			order,
			range
		]);
		let lower = bound(range?.gt, range?.gte, columns);
		let upper = bound(range?.lt, range?.lte, columns);
		if (input.cursor !== void 0) {
			const values = require_cursor.decodeCursor(scope, input.cursor);
			if (order === "asc") lower = {
				values,
				inclusive: false
			};
			else upper = {
				values,
				inclusive: false
			};
		}
		return {
			request: {
				index: index.name,
				eq,
				order,
				limit,
				...lower === void 0 ? {} : { lower },
				...upper === void 0 ? {} : { upper }
			},
			index,
			scope
		};
	};
	/** Reads rows by key in one batch; the results follow the keys' order. */
	const findByKeys = async (name, lookups) => {
		const { table } = modelOf(name, "table");
		const keys = lookups.map((lookup) => {
			if (!sameFields(Object.keys(lookup), table.key)) throw new require_errors.DatabaseQueryError(`findByKeys on ${name} takes its key: ${table.key.join(", ")}.`);
			return table.key.map((field) => keyValue(lookup[field], `${name}.${field}`));
		});
		const rows = keys.length === 0 ? [] : await adapter.get(table, keys);
		returned(rows.filter((row) => row !== null));
		return rows.map((row) => row ?? null);
	};
	return {
		maxPageSize,
		modelOf,
		reads: {
			total: () => count,
			reset: () => {
				count = {
					calls: 0,
					rows: 0
				};
			}
		},
		findByKeys,
		/** Reads one row by its key or by the eq fields of a unique index. */
		async findOne(name, lookup) {
			const { table } = modelOf(name, "table");
			const fields = Object.keys(lookup);
			if (sameFields(fields, table.key)) return (await findByKeys(name, [lookup]))[0];
			const index = table.indexes.find(({ unique, eq }) => unique && sameFields(fields, eq));
			if (index === void 0) throw new require_errors.DatabaseQueryError(`findOne on ${name} needs its key or a unique field, not ${fields.join(", ")}.`);
			const [row] = await adapter.query(table, {
				index: index.name,
				eq: index.eq.map((field) => keyValue(lookup[field], `${name}.${field}`)),
				order: "asc",
				limit: 1
			});
			return returned(row ?? null);
		},
		/** Reads one page of an index range; `next` resumes right after it. */
		async findMany(name, input) {
			const model = modelOf(name, "table");
			const { request, index, scope } = plan(model, input);
			const rows = returned(await adapter.query(model.table, request));
			const last = rows.at(-1);
			return rows.length === input.limit && last !== void 0 ? {
				rows,
				next: require_cursor.encodeCursor(scope, require_values.indexOrderTuple(model.table, index, last))
			} : { rows };
		},
		/**
		* Reads one page of logical aggregate rows, summing counters and gauges
		* and merging sketches across each row's shards. A row cut off by the
		* limit is completed by reading only its remaining shards.
		*/
		async findAggregates(name, input) {
			const model = modelOf(name, "aggregate");
			const { table, definition } = model;
			if (definition.kind !== "aggregate") throw new require_errors.DatabaseQueryError(name);
			const { request, index, scope } = plan(model, input);
			const rows = await adapter.query(table, request);
			const logicalKey = (row) => definition.key.map((column) => keyValue(row[column], column));
			const groups = /* @__PURE__ */ new Map();
			for (const row of rows) {
				const key = JSON.stringify(logicalKey(row));
				groups.set(key, [...groups.get(key) ?? [], row]);
			}
			const full = rows.length === input.limit;
			const last = [...groups.values()].at(-1);
			if (full && last !== void 0) {
				const seen = new Set(last.map((row) => row[require_resolveSchema.SHARD_COLUMN]));
				const missing = Array.from({ length: definition.shards }, (_, shard) => shard).filter((shard) => !seen.has(shard));
				if (missing.length > 0) {
					const key = logicalKey(last[0]);
					const rest = await adapter.get(table, missing.map((shard) => [...key, shard]));
					last.push(...rest.filter((row) => row !== null));
				}
			}
			const merged = [...groups.values()].map((shards) => {
				const row = Object.fromEntries(definition.key.map((field) => [field, shards[0][field]]));
				for (const metric of [...definition.counters, ...definition.gauges]) row[metric] = shards.reduce((sum, shard) => sum + Number(shard[metric] ?? 0), 0);
				for (const metric of definition.distinct) row[metric] = require_distinct.mergeDistinct(shards.map((shard) => shard[metric]));
				return row;
			});
			returned(merged);
			if (!full || last === void 0) return { rows: merged };
			const tuple = require_values.indexOrderTuple(table, index, last[0]);
			return {
				rows: merged,
				next: require_cursor.encodeCursor(scope, tuple.slice(0, -1))
			};
		}
	};
};
//#endregion
exports.DatabaseQueryError = require_errors.DatabaseQueryError;
exports.createEngineReads = createEngineReads;
