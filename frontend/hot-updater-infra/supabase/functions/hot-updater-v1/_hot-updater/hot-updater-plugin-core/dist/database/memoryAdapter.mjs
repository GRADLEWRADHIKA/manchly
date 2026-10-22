import { findPhysicalIndex, rowKey } from "./adapter.mjs";
import { compareTuples, indexEntries, indexOrderTuple, matchesQuery } from "./values.mjs";
//#region src/database/memoryAdapter.ts
const keyId = (key) => JSON.stringify(key);
const numberOf = (value) => typeof value === "number" ? value : 0;
const violatesUnique = (table, rows, id, row) => table.indexes.some((index) => {
	if (!index.unique) return false;
	const entries = indexEntries(table, index, row);
	return entries.length > 0 && [...rows].some(([otherId, other]) => otherId !== id && indexEntries(table, index, other).some((entry) => entries.some((candidate) => compareTuples(entry, candidate) === 0)));
});
const putRow = (table, rows, id, row) => {
	if (violatesUnique(table, rows, id, row)) return false;
	rows.set(id, row);
	return true;
};
/** Applies one op to a draft; false means its guard or a constraint failed. */
const applyOp = (rows, op) => {
	const id = keyId(op.type === "insert" ? rowKey(op.table, op.row) : op.key);
	const current = rows.get(id);
	const version = numberOf(current?.["_v"]);
	switch (op.type) {
		case "insert": return current === void 0 && putRow(op.table, rows, id, structuredClone(op.row));
		case "patch": return current !== void 0 && version === op.guard.v && putRow(op.table, rows, id, {
			...current,
			...structuredClone(op.set),
			["_v"]: version + 1
		});
		case "delete": return current !== void 0 && version === op.guard.v && rows.delete(id);
		case "increment": {
			const base = current ?? op.init;
			if (base === void 0 || op.guard !== void 0 && (current === void 0 || version !== op.guard.v)) return false;
			const next = structuredClone(base);
			for (const [column, delta] of Object.entries(op.by)) next[column] = numberOf(base[column]) + delta;
			next["_v"] = numberOf(base["_v"]) + 1;
			return putRow(op.table, rows, id, next);
		}
		case "check": return current !== void 0 && version === op.guard.v;
	}
};
/**
* The reference adapter: every read is a consistent snapshot and every write
* applies to a copy that replaces the state only when all ops succeed.
*/
const createMemoryAdapter = (options = {}) => {
	const prefix = options.tablePrefix ?? "";
	let state = /* @__PURE__ */ new Map();
	const rowsOf = (table) => state.get(prefix + table.name) ?? /* @__PURE__ */ new Map();
	return {
		id: "memory",
		fits: () => true,
		async get(table, keys) {
			const rows = rowsOf(table);
			return keys.map((key) => {
				const row = rows.get(keyId(key));
				return row === void 0 ? null : structuredClone(row);
			});
		},
		async query(table, request) {
			const index = findPhysicalIndex(table, request.index);
			const direction = request.order === "asc" ? 1 : -1;
			return [...rowsOf(table).values()].filter((row) => matchesQuery(table, index, request, row)).sort((left, right) => direction * compareTuples(indexOrderTuple(table, index, left), indexOrderTuple(table, index, right))).slice(0, request.limit).map((row) => structuredClone(row));
		},
		async write(ops) {
			const draft = new Map(state);
			const copied = /* @__PURE__ */ new Set();
			for (const [position, op] of ops.entries()) {
				const name = prefix + op.table.name;
				if (!copied.has(name)) {
					draft.set(name, new Map(draft.get(name)));
					copied.add(name);
				}
				if (!applyOp(draft.get(name), op)) return {
					ok: false,
					failedOp: position
				};
			}
			state = draft;
			return { ok: true };
		},
		async prune(table, before, limit) {
			const column = table.retention?.column ?? "";
			/** Oldest first; the key breaks a tie. */
			const order = (row) => [row[column], ...rowKey(table, row)];
			const doomed = [...rowsOf(table)].filter(([, row]) => {
				const time = row[column];
				return typeof time === "number" && time <= before;
			}).sort(([, left], [, right]) => compareTuples(order(left), order(right))).slice(0, limit);
			const rows = new Map(rowsOf(table));
			for (const [id] of doomed) rows.delete(id);
			state = new Map(state).set(prefix + table.name, rows);
			return doomed.length;
		},
		migrations: { async apply(tables) {
			const next = new Map(state);
			for (const table of tables) {
				const name = prefix + table.name;
				next.set(name, next.get(name) ?? /* @__PURE__ */ new Map());
			}
			state = next;
		} },
		async dispose() {
			state = /* @__PURE__ */ new Map();
		}
	};
};
//#endregion
export { createMemoryAdapter };
