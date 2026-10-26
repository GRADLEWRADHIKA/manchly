const require_adapter = require("./adapter.cjs");
const require_values = require("./values.cjs");
//#region src/database/verifyAdapter.ts
/** What `verifyAdapter` throws when an adapter call breaks the adapter contract. */
var DatabaseAdapterContractError = class extends Error {
	name = "DatabaseAdapterContractError";
};
const EMPTY = {
	gets: 0,
	keys: 0,
	queries: 0,
	rows: 0
};
const createReadMeter = () => {
	const tables = /* @__PURE__ */ new Map();
	const add = (table, count) => {
		const current = tables.get(table) ?? EMPTY;
		tables.set(table, {
			gets: current.gets + (count.gets ?? 0),
			keys: current.keys + (count.keys ?? 0),
			queries: current.queries + (count.queries ?? 0),
			rows: current.rows + (count.rows ?? 0)
		});
	};
	return {
		add,
		meter: {
			total: () => [...tables.values()].reduce((sum, count) => ({
				gets: sum.gets + count.gets,
				keys: sum.keys + count.keys,
				queries: sum.queries + count.queries,
				rows: sum.rows + count.rows
			}), EMPTY),
			byTable: (table) => tables.get(table) ?? EMPTY,
			reset: () => tables.clear()
		}
	};
};
const fail = (message) => {
	throw new DatabaseAdapterContractError(message);
};
const sameKey = (left, right) => left.length === right.length && require_values.compareTuples(left, right) === 0;
const verifyRequest = (table, request) => {
	const index = require_adapter.findPhysicalIndex(table, request.index);
	if (!Number.isSafeInteger(request.limit) || request.limit < 1 || request.limit > 500) fail(`query limit must be 1–500.`);
	if (request.eq.length !== index.eq.length || !request.eq.every(require_values.isKeyValue)) fail(`query on ${table.name}.${index.name} must bind every eq column.`);
	return index;
};
const verifyRows = (table, request, rows) => {
	const index = require_adapter.findPhysicalIndex(table, request.index);
	if (rows.length > request.limit) fail(`${table.name}.${index.name} returned more than ${request.limit} rows.`);
	let previous;
	for (const row of rows) {
		if (!require_values.matchesQuery(table, index, request, row)) fail(`${table.name}.${index.name} returned a row outside the request.`);
		const tuple = require_values.indexOrderTuple(table, index, row);
		if (previous !== void 0) {
			const order = require_values.compareTuples(previous, tuple);
			if (request.order === "asc" ? order >= 0 : order <= 0) fail(`${table.name}.${index.name} returned rows out of order.`);
		}
		previous = tuple;
	}
	return previous;
};
const verifyWrite = (adapter, ops) => {
	if (ops.length === 0) fail("write needs at least one op.");
	const seen = /* @__PURE__ */ new Set();
	for (const op of ops) {
		const key = op.type === "insert" ? require_adapter.rowKey(op.table, op.row) : op.key;
		const id = JSON.stringify([op.table.name, key]);
		if (seen.has(id)) fail(`write touches ${op.table.name} ${id} twice.`);
		seen.add(id);
		if (op.type === "insert" && typeof op.row["_v"] !== "number") fail(`insert into ${op.table.name} must set _v.`);
		if (op.type === "patch" && Object.keys(op.set).some((column) => column === "_v" || op.table.key.includes(column))) fail(`patch of ${op.table.name} may not set key columns or _v.`);
	}
	if (!adapter.fits(ops)) fail("write does not fit in one atomic write.");
};
/** Wraps an adapter to check the contract at its boundary and count reads. */
const verifyAdapter = (adapter, options = {}) => {
	const { add, meter } = createReadMeter();
	return {
		...adapter,
		id: adapter.id,
		reads: meter,
		fits: (ops) => adapter.fits(ops),
		async get(table, keys) {
			const rows = await adapter.get(table, keys);
			add(table.name, {
				gets: 1,
				keys: keys.length
			});
			if (rows.length !== keys.length) fail(`${table.name} get returned ${rows.length} rows for ${keys.length} keys.`);
			rows.forEach((row, position) => {
				if (row !== null && !sameKey(require_adapter.rowKey(table, row), keys[position])) fail(`${table.name} get returned a row for another key.`);
			});
			return rows;
		},
		async query(table, request) {
			const index = verifyRequest(table, request);
			const rows = await adapter.query(table, request);
			add(table.name, {
				queries: 1,
				rows: rows.length
			});
			const last = verifyRows(table, request, rows);
			if (options.probeShortPages && last !== void 0 && rows.length < request.limit) {
				const bound = {
					values: last,
					inclusive: false
				};
				if ((await adapter.query(table, {
					...request,
					limit: 1,
					...request.order === "asc" ? { lower: bound } : { upper: bound }
				})).length > 0) fail(`${table.name}.${index.name} returned a short page before the range ended.`);
			}
			return rows;
		},
		...adapter.prune && { async prune(table, before, limit) {
			if (table.retention === void 0) fail(`${table.name} has no retention to prune by.`);
			if (!Number.isSafeInteger(limit) || limit < 1) fail("prune limit must be a positive integer.");
			const deleted = await adapter.prune(table, before, limit);
			if (!Number.isSafeInteger(deleted) || deleted < 0 || deleted > limit) fail(`${table.name} prune reported ${deleted} rows for ${limit}.`);
			return deleted;
		} },
		async write(ops) {
			verifyWrite(adapter, ops);
			const result = await adapter.write(ops);
			if (!result.ok && "failedOp" in result) {
				if (!Number.isSafeInteger(result.failedOp) || result.failedOp < 0 || result.failedOp >= ops.length) fail(`write reported failedOp ${result.failedOp} for ${ops.length} ops.`);
			}
			return result;
		}
	};
};
//#endregion
exports.DatabaseAdapterContractError = DatabaseAdapterContractError;
exports.verifyAdapter = verifyAdapter;
