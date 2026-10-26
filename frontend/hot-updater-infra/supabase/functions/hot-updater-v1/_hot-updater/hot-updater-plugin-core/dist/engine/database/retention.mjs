//#region src/engine/database/retention.ts
const MINUTE_MS = 6e4;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
/** A model's retention as its physical table carries it, which each adapter maps natively. */
const physicalRetention = ({ retention }) => retention === void 0 ? {} : { retention: {
	column: retention.field,
	ms: retention.days * DAY_MS
} };
/** Models in a reference or a rooted index, which an expired row's delete would break. */
const linkedModels = (schema) => Object.entries(schema).flatMap(([name, { fields, indexes }]) => [...Object.values(fields).map(({ references }) => references), ...Object.values(indexes).map(({ root }) => root)].flatMap((link) => link ? [name, link.model] : []));
/**
* What is wrong with a model's retention: it counts from an integer field,
* over whole days, and expired rows are deleted without cascades, counter
* moves, or root bumps, so the model is in no reference or rooted index.
*/
const retentionProblems = (schema, model) => {
	const definition = schema[model];
	if (definition.retention === void 0) return [];
	const { field, days } = definition.retention;
	const declared = definition.fields[field] ?? (definition.kind === "table" ? definition.derived[field] : void 0);
	return [
		...declared?.type !== "integer" || "multi" in declared && declared.multi === true ? [`retention field "${field}" is not an integer field`] : [],
		...Number.isSafeInteger(days) && days >= 1 ? [] : ["retention days must be a whole number of at least 1"],
		...linkedModels(schema).includes(model) ? ["a model with retention is in no reference or rooted index"] : []
	];
};
/**
* Rows a pass deletes from each table: one statement or two a table, so a
* pass stays well inside D1's 50 queries an invocation.
*/
const PASS_LIMIT = 500;
/** The lease row: when the next pass is due, in epoch ms. */
const LEASE_KEY = "retention.nextPassAt";
/**
* The adapter, pruning during its writes with no scheduler: once the lease
* row in `leaseTable` is due, the write that takes it first runs one bounded
* pass over the tables with retention, and other writers skip. The next pass
* is due in an hour, or in a minute while a pass still found a full batch of
* expired rows in some table; a pass that fails is due again at once. A
* backend that expires rows natively, or a schema without retention, gets its
* adapter back.
*/
const pruneDuringWrites = (adapter, tables, { leaseTable: table, now }) => {
	const expiring = tables.filter(({ retention }) => retention !== void 0);
	if (adapter.prune === void 0 || expiring.length === 0) return adapter;
	const key = [LEASE_KEY];
	let checkAt = 0;
	const lease = async (row, due) => {
		const value = String(due);
		const guard = { v: row === null ? -1 : Number(row._v) };
		const next = {
			key: LEASE_KEY,
			value,
			_v: guard.v + 1
		};
		const op = row === null ? {
			type: "insert",
			table,
			row: next
		} : {
			type: "patch",
			table,
			key,
			set: { value },
			guard,
			previous: row
		};
		return (await adapter.write([op])).ok ? next : null;
	};
	const pass = async () => {
		const at = now();
		if (at < checkAt) return;
		checkAt = at + MINUTE_MS;
		const [row = null] = await adapter.get(table, [key]);
		checkAt = row === null ? at : Number(row.value);
		if (checkAt > at) return;
		const held = await lease(row, at + HOUR_MS);
		if (held === null) return;
		checkAt = at + HOUR_MS;
		const deleted = [];
		try {
			for (const t of expiring) deleted.push(await adapter.prune(t, at - t.retention.ms, PASS_LIMIT));
		} catch (error) {
			checkAt = at + MINUTE_MS;
			await lease(held, at).catch(() => null);
			throw error;
		}
		if (deleted.includes(PASS_LIMIT) && await lease(held, at + MINUTE_MS) !== null) checkAt = at + MINUTE_MS;
	};
	const warn = (error) => console.warn("[hot-updater] Pruning expired rows failed.", error);
	return Object.assign(Object.create(adapter), { async write(ops) {
		await pass().catch(warn);
		return adapter.write(ops);
	} });
};
//#endregion
export { physicalRetention, pruneDuringWrites, retentionProblems };
