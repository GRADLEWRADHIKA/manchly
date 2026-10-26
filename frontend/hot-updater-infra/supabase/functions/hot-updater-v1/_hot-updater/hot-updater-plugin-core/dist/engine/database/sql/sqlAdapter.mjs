import { findPhysicalColumn, findPhysicalIndex, indexOrderColumns, rowKey } from "../../../database/adapter.mjs";
import { indexEntries, indexOrderTuple, normalizeStoredRow } from "../../../database/values.mjs";
import { createTableStatements, isMultiIndex, pruneStatements, quoteSql } from "./sqlSchema.mjs";
//#region src/engine/database/sql/sqlAdapter.ts
/** Where a batch write records its first failed op, before any change applies. */
const WRITE_GUARD_TABLE = {
	name: "_hu_write",
	columns: [{
		name: "id",
		type: "string",
		nullable: false,
		maxLength: 36
	}, {
		name: "failed_op",
		type: "integer",
		nullable: true
	}],
	key: ["id"],
	indexes: []
};
const codes = (values) => new Set(values.split(" "));
const UNIQUE = codes("23505 1062 23503 1451 1452 SQLITE_CONSTRAINT_UNIQUE SQLITE_CONSTRAINT_PRIMARYKEY SQLITE_CONSTRAINT_FOREIGNKEY SQLITE:2067 SQLITE:1555 SQLITE:787");
const RETRY = codes("40001 40P01 1213 1205 SQLITE_BUSY SQLITE_BUSY_SNAPSHOT SQLITE_LOCKED SQLITE:5 SQLITE:517 SQLITE:6");
/** Driver codes on an error and its causes: SQLSTATE, MySQL errno, SQLite codes. */
const codesOf = (error, depth = 0) => {
	if (typeof error !== "object" || error === null || depth > 3) return [];
	const record = error;
	const named = [
		"code",
		"errno",
		"sqlState",
		"extendedCode"
	].flatMap((field) => record[field] === void 0 ? [] : [String(record[field])]);
	const sqlite = ["errcode", "rawCode"].flatMap((field) => typeof record[field] === "number" ? [`SQLITE:${record[field]}`] : []);
	return [
		...named,
		...sqlite,
		...codesOf(record.cause, depth + 1)
	];
};
/** A constraint names the failed op; a transient error asks the engine to retry. */
const classifySqlError = (error) => {
	const found = codesOf(error);
	if (found.some((code) => UNIQUE.has(code))) return "constraint";
	return found.some((code) => RETRY.has(code)) ? "retry" : void 0;
};
/** An increment that creates its missing row: an upsert, which always applies. */
const upserts = (op) => op.type === "increment" && op.init !== void 0 && op.guard === void 0;
var FailedOp = class {
	index;
	constructor(index) {
		this.index = index;
	}
};
/**
* The shared SQL core over one executor: each write compiles to statements
* run in one transaction, or in one atomic batch where the executor batches.
*/
const createSqlAdapter = ({ executor, tablePrefix = "", maxOps = 1e3, maxParams = Number.POSITIVE_INFINITY }) => {
	const { dialect } = executor;
	const postgres = dialect === "postgresql";
	const sqlite = dialect === "sqlite";
	const lock = sqlite ? "" : " FOR UPDATE";
	const quote = (name) => quoteSql(dialect, name);
	const tableOf = (table, index) => quote(`${tablePrefix}${table.name}${index ? `__${index.name}` : ""}`);
	const version = quote("_v");
	/** A statement from `build`, whose `bind` collects parameters in order. */
	const sql = (build) => {
		const params = [];
		const bind = (value, column) => {
			const json = column?.multi || column?.type === "json";
			params.push(value === null || value === void 0 ? null : json ? JSON.stringify(value) : typeof value === "boolean" && !postgres ? Number(value) : value);
			return postgres ? `$${params.length}${json ? "::jsonb" : ""}` : "?";
		};
		return {
			sql: build(bind),
			params
		};
	};
	/** Each key column equal to its value in `key`. */
	const keyMatch = (bind, table, key) => table.key.map((column, position) => `${quote(column)} = ${bind(key[position])}`).join(" AND ");
	/** `columns op values` over a tuple prefix, expanded into ORs on MySQL. */
	const compare = (bind, columns, bound, op) => {
		const cols = columns.slice(0, bound.values.length).map((column) => `i.${quote(column)}`);
		const last = `${op}${bound.inclusive ? "=" : ""}`;
		if (cols.length === 1) return `${cols[0]} ${last} ${bind(bound.values[0])}`;
		if (dialect !== "mysql") {
			const values = bound.values.map((value) => bind(value));
			return `(${cols.join(", ")}) ${last} (${values.join(", ")})`;
		}
		return `(${cols.map((column, position) => [...cols.slice(0, position).map((prefix, at) => `${prefix} = ${bind(bound.values[at])}`), `${column} ${position === cols.length - 1 ? last : op} ${bind(bound.values[position])}`].join(" AND ")).map((term) => `(${term})`).join(" OR ")})`;
	};
	/**
	* An op's statements; the first one's result shows whether the op applied.
	* Guards via `UPDATE … WHERE _v = ?`, checks via locking reads, counters
	* via upserts. With `when`, every statement also carries that condition,
	* and a check has none: a batch write evaluated it first (`failure`).
	*/
	const compile = (op, when) => {
		const { table } = op;
		const name = tableOf(table);
		/** The row with `key`, at version `v` when given, where `when` holds. */
		const where = (bind, key, v) => `${keyMatch(bind, table, key)}${v === void 0 ? "" : ` AND ${version} = ${bind(v)}`}${when ? ` AND ${when(bind)}` : ""}`;
		/** Inserts bound values; with `when`, a SELECT yields them only while it holds. */
		const insert = (bind, into, columns, values) => `INSERT INTO ${into} (${columns.map(quote).join(", ")}) ${when ? `SELECT ${values.join(", ")} WHERE ${when(bind)}` : `VALUES (${values.join(", ")})`}`;
		/** Inserts `row` into the op's table, each value bound as its column's type. */
		const insertRow = (bind, row) => insert(bind, name, table.columns.map((column) => column.name), table.columns.map((column) => bind(row[column.name], column)));
		/** Replaces the row's entries in the index table of every multi-valued index. */
		const entries = (key, row, changed) => table.indexes.flatMap((index) => {
			const columns = [...index.eq, ...indexOrderColumns(table, index)];
			if (!isMultiIndex(table, index) || changed && !columns.some((column) => changed.includes(column))) return [];
			const into = tableOf(table, index);
			const found = row ? indexEntries(table, index, row) : [];
			const order = found.length > 0 ? indexOrderTuple(table, index, row) : [];
			return [sql((bind) => `DELETE FROM ${into} WHERE ${where(bind, key)}`), ...found.map((eq) => sql((bind) => {
				const values = [...eq, ...order].map((value) => bind(value));
				return insert(bind, into, columns, values);
			}))];
		});
		switch (op.type) {
			case "insert": return [sql((bind) => insertRow(bind, op.row)), ...entries(rowKey(table, op.row), op.row)];
			case "patch": return [sql((bind) => {
				const set = Object.entries(op.set).map(([column, value]) => `${quote(column)} = ${bind(value, findPhysicalColumn(table, column))}`);
				return `UPDATE ${name} SET ${[...set, `${version} = ${version} + 1`].join(", ")} WHERE ${where(bind, op.key, op.guard.v)}`;
			}), ...entries(op.key, {
				...op.previous,
				...op.set
			}, Object.keys(op.set))];
			case "delete": return [sql((bind) => `DELETE FROM ${name} WHERE ${where(bind, op.key, op.guard.v)}`), ...entries(op.key)];
			case "increment": {
				const deltas = [...Object.entries(op.by), ["_v", 1]];
				const bump = (bind, qualify = "") => deltas.map(([column, delta]) => `${quote(column)} = ${qualify}${quote(column)} + ${bind(delta)}`).join(", ");
				if (!upserts(op)) return [sql((bind) => `UPDATE ${name} SET ${bump(bind)} WHERE ${where(bind, op.key, op.guard?.v)}`)];
				const row = { ...op.init };
				for (const [column, delta] of deltas) row[column] = Number(row[column] ?? 0) + delta;
				const conflict = dialect === "mysql" ? "ON DUPLICATE KEY UPDATE" : `ON CONFLICT (${table.key.map(quote).join(", ")}) DO UPDATE SET`;
				return [sql((bind) => `${insertRow(bind, row)} ${conflict} ${bump(bind, `${name}.`)}`)];
			}
			case "check":
				if (when) return [];
				return [sql((bind) => `SELECT ${version} FROM ${name} WHERE ${where(bind, op.key)}${lock}`)];
		}
	};
	/**
	* SQL that holds when `op` would fail against the rows before any change.
	* Rows the write deletes or patches (`released`) do not count as holding a
	* unique value.
	*/
	const failure = (bind, op, released) => {
		const { table } = op;
		const from = `SELECT 1 FROM ${tableOf(table)} WHERE`;
		const exists = (key, v) => `EXISTS (${from} ${keyMatch(bind, table, key)}${v === void 0 ? "" : ` AND ${version} = ${bind(v)}`}${lock})`;
		/** Another row already holding a unique value this op writes. */
		const clashes = (row, own, changed) => table.indexes.filter((index) => index.unique && !isMultiIndex(table, index) && index.eq.every((column) => (row[column] ?? null) !== null) && (!changed || index.eq.some((column) => changed.includes(column)))).map((index) => {
			const match = index.eq.map((column) => `${quote(column)} = ${bind(row[column], findPhysicalColumn(table, column))}`);
			const others = [...own ? [own] : [], ...released].map((key) => ` AND NOT (${keyMatch(bind, table, key)})`);
			return `EXISTS (${from} ${match.join(" AND ")}${others.join("")})`;
		});
		switch (op.type) {
			case "insert": return [exists(rowKey(table, op.row)), ...clashes(op.row)].join(" OR ");
			case "patch": return [`NOT ${exists(op.key, op.guard.v)}`, ...clashes({
				...op.previous,
				...op.set
			}, op.key, Object.keys(op.set))].join(" OR ");
			default: return `NOT ${exists(op.key, op.guard?.v)}`;
		}
	};
	/**
	* A write as one atomic batch, for drivers without interactive transactions:
	* each op's guard, against the rows before any change, records the first
	* failing op in a guard row; every change applies only when none failed; the
	* last two statements read the failure and remove the row. Unique fields are
	* checked ahead, since a batch cannot name the statement a constraint stopped.
	*/
	const batchWrite = (ops, id) => {
		const guard = tableOf(WRITE_GUARD_TABLE);
		const [idColumn, failed] = ["id", "failed_op"].map(quote);
		const byId = (bind) => `${idColumn} = ${bind(id)}`;
		const released = (table) => ops.flatMap((op) => (op.type === "delete" || op.type === "patch") && op.table.name === table ? [op.key] : []);
		const when = (bind) => `(SELECT ${failed} FROM ${guard} WHERE ${byId(bind)}) IS NULL`;
		return [
			sql((bind) => `INSERT INTO ${guard} (${idColumn}, ${failed}) VALUES (${bind(id)}, NULL)`),
			...ops.flatMap((op, position) => upserts(op) ? [] : [sql((bind) => `UPDATE ${guard} SET ${failed} = ${position} WHERE ${failed} IS NULL AND (${failure(bind, op, released(op.table.name))}) AND ${byId(bind)}`)]),
			...ops.flatMap((op) => compile(op, when)),
			sql((bind) => `SELECT ${failed} FROM ${guard} WHERE ${byId(bind)}`),
			sql((bind) => `DELETE FROM ${guard} WHERE ${byId(bind)}`)
		];
	};
	/** Runs a read and converts its rows to stored values. */
	const read = async (table, statement) => {
		const { rows } = await executor.execute(statement);
		return rows.map((row) => normalizeStoredRow(table, row, { jsonText: sqlite }));
	};
	return {
		id: `sql:${dialect}`,
		fits: (ops) => ops.length <= maxOps,
		async get(table, keys) {
			const size = Math.max(1, Math.floor(maxParams / table.key.length));
			const found = /* @__PURE__ */ new Map();
			for (let start = 0; start < keys.length; start += size) {
				const chunk = keys.slice(start, start + size);
				const statement = sql((bind) => {
					const where = chunk.map((key) => `(${keyMatch(bind, table, key)})`);
					return `SELECT * FROM ${tableOf(table)} WHERE ${where.join(" OR ")}`;
				});
				for (const row of await read(table, statement)) found.set(JSON.stringify(rowKey(table, row)), row);
			}
			return keys.map((key) => found.get(JSON.stringify(key)) ?? null);
		},
		async query(table, request) {
			const index = findPhysicalIndex(table, request.index);
			if (!Number.isSafeInteger(request.limit) || request.limit < 1) throw new RangeError("query limit must be a positive integer.");
			const order = indexOrderColumns(table, index);
			const multi = isMultiIndex(table, index);
			const source = multi ? `${tableOf(table, index)} i JOIN ${tableOf(table)} b ON ${table.key.map((column) => `b.${quote(column)} = i.${quote(column)}`).join(" AND ")}` : `${tableOf(table)} i`;
			const direction = request.order === "asc" ? "ASC" : "DESC";
			const statement = sql((bind) => {
				const conditions = [
					...index.eq.map((column, position) => `i.${quote(column)} = ${bind(request.eq[position])}`),
					...request.lower ? [compare(bind, order, request.lower, ">")] : [],
					...request.upper ? [compare(bind, order, request.upper, "<")] : []
				];
				return `SELECT ${multi ? "b" : "i"}.* FROM ${source}${conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : ""} ORDER BY ${order.map((column) => `i.${quote(column)} ${direction}`).join(", ")} LIMIT ${request.limit}`;
			});
			return read(table, statement);
		},
		async write(ops) {
			try {
				if (executor.batch) {
					const statements = batchWrite(ops, crypto.randomUUID());
					const failed = (await executor.batch(statements)).at(-2)?.rows[0]?.failed_op ?? null;
					return failed === null ? { ok: true } : {
						ok: false,
						failedOp: Number(failed)
					};
				}
				await executor.transaction(async (connection) => {
					for (const [position, op] of ops.entries()) {
						const [first, ...rest] = compile(op);
						let result;
						try {
							result = await connection.execute(first);
						} catch (error) {
							if (classifySqlError(error) === "constraint") throw new FailedOp(position);
							throw error;
						}
						if (!(op.type === "check" ? result.rows.length === 1 && Number(result.rows[0]["_v"]) === op.guard.v : op.type === "insert" || upserts(op) || result.changes === 1)) throw new FailedOp(position);
						for (const statement of rest) await connection.execute(statement);
					}
				});
				return { ok: true };
			} catch (error) {
				if (error instanceof FailedOp) return {
					ok: false,
					failedOp: error.index
				};
				const kind = classifySqlError(error);
				if (kind === "retry") return {
					ok: false,
					retry: true
				};
				if (kind === "constraint" && executor.batch) return {
					ok: false,
					failedOp: 0
				};
				throw error;
			}
		},
		async prune(table, before, limit) {
			const statements = pruneStatements(dialect, table, tablePrefix, limit).map((render) => sql((bind) => render(() => bind(before))));
			return (executor.batch ? await executor.batch(statements) : await executor.transaction(async (connection) => {
				const done = [];
				for (const statement of statements) done.push(await connection.execute(statement));
				return done;
			})).at(-1)?.changes ?? 0;
		},
		migrations: { async apply(tables) {
			const created = executor.batch && !tables.includes(WRITE_GUARD_TABLE) ? [...tables, WRITE_GUARD_TABLE] : tables;
			const statements = createTableStatements(dialect, created, tablePrefix);
			for (const text of statements) await executor.execute({
				sql: text,
				params: []
			});
		} }
	};
};
//#endregion
export { WRITE_GUARD_TABLE, classifySqlError, createSqlAdapter };
