//#region src/database/adapter.ts
/**
* The version column every stored row carries, which a guarded write
* compares and bumps. An adapter that is neither SQL nor key-value, such as
* the MongoDB adapter, stores and checks it itself.
*/
const DATABASE_VERSION_COLUMN = "_v";
var DatabaseSchemaError = class extends Error {
	name = "DatabaseSchemaError";
};
/**
* The column `name` of `table`, or a `DatabaseSchemaError`: how an adapter
* that is neither SQL nor key-value, such as the MongoDB adapter, reads a
* column's type.
*/
const findPhysicalColumn = (table, name) => {
	const column = table.columns.find((candidate) => candidate.name === name);
	if (column === void 0) throw new DatabaseSchemaError(`${table.name} has no column ${name}.`);
	return column;
};
/**
* The index `name` of `table`, or a `DatabaseSchemaError`: how an adapter
* that is neither SQL nor key-value, such as the MongoDB adapter, resolves a
* query's `index`.
*/
const findPhysicalIndex = (table, name) => {
	const index = table.indexes.find((candidate) => candidate.name === name);
	if (index === void 0) throw new DatabaseSchemaError(`${table.name} has no index ${name}.`);
	return index;
};
/**
* The columns that order an index read and close its cursors: the sort
* columns, then the key columns that neither `eq` nor `sort` fixes.
*/
const indexOrderColumns = (table, index) => [...index.sort, ...table.key.filter((column) => !index.sort.includes(column) && !index.eq.includes(column))];
/**
* When a row of a table with retention expires, in epoch milliseconds, or
* undefined when the table keeps its rows or the row's time is null.
*/
const expiresAt = (table, row) => {
	const time = table.retention && row[table.retention.column];
	return typeof time === "number" ? time + table.retention.ms : void 0;
};
/**
* The primary key of a row, in key-column order: what `get` takes for it.
* An adapter that is neither SQL nor key-value, such as the MongoDB adapter,
* addresses rows by it.
*/
const rowKey = (table, row) => table.key.map((column) => {
	const value = row[column];
	if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") throw new DatabaseSchemaError(`${table.name}.${column} is a key column and must be a string, number, or boolean.`);
	return value;
});
//#endregion
export { DATABASE_VERSION_COLUMN, DatabaseSchemaError, expiresAt, findPhysicalColumn, findPhysicalIndex, indexOrderColumns, rowKey };
