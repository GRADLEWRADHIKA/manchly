import { DatabaseSchemaError, findPhysicalColumn, indexOrderColumns } from "../../../database/adapter.mjs";
//#region src/engine/database/sql/sqlSchema.ts
/**
* Quotes an identifier: backticks on MySQL, double quotes elsewhere. An ORM
* schema generator, or an executor that issues statements of its own, quotes
* names as the SQL core does with it, as the Prisma adapter's do.
*/
const quoteSql = (dialect, name) => dialect === "mysql" ? `\`${name.replaceAll("`", "``")}\`` : `"${name.replaceAll("\"", "\"\"")}"`;
const isMultiIndex = (table, index) => index.eq.some((column) => findPhysicalColumn(table, column).multi);
/** Keeps an identifier within PostgreSQL's 63 and MySQL's 64 characters. */
const shortSqlName = (name) => {
	if (name.length <= 60) return name;
	let hash = 2166136261;
	for (const char of name) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
	return `${name.slice(0, 51)}_${hash.toString(36)}`;
};
/** The column type; `entry` types one value of a multi-valued column in its index table. */
const columnType = (dialect, column, indexed, entry = false) => {
	if (column.multi && !entry || column.type === "json") return {
		postgresql: "jsonb",
		mysql: "json",
		sqlite: "TEXT"
	}[dialect];
	if (column.type === "string") {
		const length = column.maxLength ?? (indexed ? 255 : void 0);
		if (dialect === "sqlite") return "TEXT";
		if (dialect === "postgresql") return `${column.maxLength ? `varchar(${column.maxLength})` : "text"} COLLATE "C"`;
		const charset = column.ascii ? "ascii COLLATE ascii_bin" : "utf8mb4 COLLATE utf8mb4_0900_bin";
		return `${length ? `varchar(${length})` : "longtext"} CHARACTER SET ${charset}`;
	}
	if (column.type === "integer") return dialect === "sqlite" ? "INTEGER" : "bigint";
	if (column.type === "number") return {
		postgresql: "double precision",
		mysql: "double",
		sqlite: "REAL"
	}[dialect];
	return dialect === "sqlite" ? "INTEGER" : "boolean";
};
/** InnoDB's limit on the bytes of one key or index. */
const MYSQL_KEY_BYTES = 3072;
/** Refuses a MySQL key or index over InnoDB's limit before any DDL runs. */
const checkMysqlKey = (table, name, columns) => {
	const bytes = columns.reduce((sum, column) => {
		const { type, maxLength, ascii } = findPhysicalColumn(table, column);
		if (type === "string") return sum + (maxLength ?? 255) * (ascii ? 1 : 4);
		return sum + (type === "boolean" ? 1 : 8);
	}, 0);
	if (bytes > MYSQL_KEY_BYTES) throw new DatabaseSchemaError(`${table.name} ${name} needs ${bytes} bytes on MySQL, over its ${MYSQL_KEY_BYTES}; shorten its strings or mark ASCII ones ascii.`);
};
/**
* Each table as the DDL creates it, for the DDL below and for ORM schema
* generators, such as the Drizzle and Prisma adapters': binary collation, one index per declared index, and an index
* table `<table>__<index>` for each index over a multi-valued field, keyed by
* every column it holds.
*/
const sqlTableShapes = (dialect, tables, tablePrefix = "") => tables.map((table) => {
	const name = tablePrefix + table.name;
	const indexed = /* @__PURE__ */ new Set([...table.key, ...table.indexes.flatMap(({ eq, sort }) => [...eq, ...sort])]);
	if (dialect === "mysql") checkMysqlKey(table, "key", table.key);
	const indexes = table.indexes.flatMap((index) => {
		const columns = [...index.eq, ...indexOrderColumns(table, index)];
		if (dialect === "mysql") checkMysqlKey(table, `index ${index.name}`, columns);
		if (isMultiIndex(table, index)) {
			const entries = columns.map((column) => ({
				name: column,
				type: columnType(dialect, findPhysicalColumn(table, column), true, true),
				notNull: true
			}));
			return [{
				kind: "table",
				table: {
					name: `${name}__${index.name}`,
					columns: entries,
					key: columns,
					indexes: []
				}
			}];
		}
		if (!index.unique && columns.join() === table.key.join()) return [];
		return [{
			kind: "index",
			name: shortSqlName(`${name}_${index.name}`),
			unique: index.unique === true,
			columns: index.unique ? index.eq : columns
		}];
	});
	const retention = table.retention && retentionOrder(table);
	if (retention && !retention.indexed) indexes.push({
		kind: "index",
		name: shortSqlName(`${name}__retention`),
		unique: false,
		columns: retention.columns
	});
	return {
		name,
		columns: table.columns.map((column) => ({
			name: column.name,
			type: columnType(dialect, column, indexed.has(column.name)),
			notNull: !column.nullable,
			...column.default === void 0 ? {} : { default: column.default }
		})),
		key: table.key,
		indexes
	};
});
/** DDL for the tables' shapes: each table, then its indexes and index tables. */
const createTableStatements = (dialect, tables, tablePrefix = "") => {
	const quote = (name) => quoteSql(dialect, name);
	const list = (columns) => columns.map(quote).join(", ");
	const render = (shape) => {
		const definitions = shape.columns.map((column) => `${quote(column.name)} ${column.type}${column.notNull ? " NOT NULL" : ""}${column.default === void 0 ? "" : ` DEFAULT ${column.default}`}`);
		definitions.push(`PRIMARY KEY (${list(shape.key)})`);
		const after = [];
		for (const index of shape.indexes) if (index.kind === "table") after.push(...render(index.table));
		else if (dialect === "mysql") definitions.push(`${index.unique ? "UNIQUE " : ""}INDEX ${quote(index.name)} (${list(index.columns)})`);
		else after.push(`CREATE ${index.unique ? "UNIQUE " : ""}INDEX IF NOT EXISTS ${quote(index.name)} ON ${quote(shape.name)} (${list(index.columns)})`);
		return [`CREATE TABLE IF NOT EXISTS ${quote(shape.name)} (${definitions.join(", ")})`, ...after];
	};
	return sqlTableShapes(dialect, tables, tablePrefix).flatMap(render);
};
/**
* The order a prune walks a table's expired rows in, which ends with the
* key so it is total: the columns of the first index that leads with the
* retention column, or the key when it does, or else the column and the
* key, which then need an index of their own (`indexed` false).
*/
const retentionOrder = (table) => {
	const { column } = table.retention;
	for (const index of table.indexes) {
		const columns = [...index.eq, ...indexOrderColumns(table, index)];
		if (!index.unique && !isMultiIndex(table, index) && columns[0] === column) return {
			columns,
			indexed: true
		};
	}
	if (table.key[0] === column) return {
		columns: table.key,
		indexed: true
	};
	return {
		columns: [column, ...table.key.filter((field) => field !== column)],
		indexed: false
	};
};
/**
* The statements that delete up to `limit` expired rows of a table with
* retention, oldest first in {@link retentionOrder}: its multi-valued index
* entries, then the rows, which a concurrent write that moved the retention
* column past `before` keeps. `before` renders the bound each time it
* appears. MySQL deletes with ORDER BY and LIMIT. Elsewhere the cutoff is
* the last of the `limit` oldest expired rows in that order, a row value
* the index ranges over, and the shapes pass Supabase's apply RPC: no IN, no
* AS, aliases `i` and `b`.
*/
const pruneStatements = (dialect, table, tablePrefix, limit) => {
	const quote = (name) => quoteSql(dialect, name);
	const name = quote(`${tablePrefix}${table.name}`);
	const at = quote(table.retention.column);
	const order = retentionOrder(table).columns.map(quote);
	const list = (alias, direction = "") => order.map((column) => `${alias}.${column}${direction}`).join(", ");
	const oldest = (before) => `SELECT ${list("i")} FROM ${name} i WHERE i.${at} <= ${before()} ORDER BY ${list("i", " ASC")} LIMIT ${limit}`;
	const doomed = (alias, before) => `${alias}.${at} <= ${before()} AND (${list(alias)}) <= (SELECT ${list("b")} FROM (${oldest(before)}) b ORDER BY ${list("b", " DESC")} LIMIT 1)`;
	const entries = table.indexes.filter((index) => isMultiIndex(table, index)).map((index) => quote(`${tablePrefix}${table.name}__${index.name}`));
	const keyOf = (left, right) => table.key.map((column) => `${left}.${quote(column)} = ${right}.${quote(column)}`).join(" AND ");
	if (dialect === "mysql") return [...entries.map((index) => (before) => `DELETE e FROM ${index} e JOIN (${oldest(before)}) d ON ${keyOf("e", "d")}`), (before) => `DELETE FROM ${name} WHERE ${at} <= ${before()} ORDER BY ${order.join(", ")} LIMIT ${limit}`];
	return [...entries.map((index) => (before) => `DELETE FROM ${index} WHERE EXISTS (SELECT * FROM ${name} b WHERE ${keyOf("b", index)} AND ${doomed("b", before)})`), (before) => `DELETE FROM ${name} WHERE ${doomed(name, before)}`];
};
//#endregion
export { createTableStatements, isMultiIndex, pruneStatements, quoteSql, retentionOrder, shortSqlName, sqlTableShapes };
