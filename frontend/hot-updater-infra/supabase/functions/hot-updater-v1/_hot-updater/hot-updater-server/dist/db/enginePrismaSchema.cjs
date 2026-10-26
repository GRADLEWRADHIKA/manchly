let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/db/enginePrismaSchema.ts
const SCALARS = {
	TEXT: "String",
	INTEGER: "BigInt",
	REAL: "Float",
	bigint: "BigInt",
	"double precision": "Float",
	double: "Float",
	boolean: "Boolean",
	jsonb: "Json",
	json: "Json"
};
/**
* A column's Prisma type from the DDL type the shared SQL schema gives it.
* MySQL's ASCII keys become `VarBinary`: the same bytes and order as
* `ascii_bin`, within InnoDB's key limit without a character set.
*/
const prismaColumn = (provider, { type }) => {
	const length = /^varchar\((\d+)\)/u.exec(type)?.[1];
	if (provider === "mysql" && type.includes("CHARACTER SET")) {
		if (type.includes("CHARACTER SET ascii") && length) return {
			scalar: "Bytes",
			native: `@db.VarBinary(${length})`
		};
		return {
			scalar: "String",
			native: length ? `@db.VarChar(${length})` : "@db.LongText",
			collate: true
		};
	}
	if (provider === "postgresql" && type.includes("COLLATE")) return {
		scalar: "String",
		...length ? { native: `@db.VarChar(${length})` } : {},
		collate: true
	};
	return { scalar: SCALARS[type] ?? "String" };
};
/** Prisma fields start with a letter: `_v` becomes `hu_v`, mapped back to `_v`. */
const fieldName = (column) => column.startsWith("_") ? `hu${column}` : column;
const list = (columns) => `[${columns.map(fieldName).join(", ")}]`;
const flatten = (shapes) => shapes.flatMap((shape) => [shape, ...flatten(shape.indexes.flatMap((index) => index.kind === "table" ? [index.table] : []))]);
const shapesOf = (provider, schema) => flatten((0, _hot_updater_plugin_core.sqlTableShapes)(provider, [...schema.tables, _hot_updater_plugin_core.SETTINGS_TABLE]));
const renderField = (provider, column) => {
	const { scalar, native } = prismaColumn(provider, column);
	const name = fieldName(column.name);
	return [
		`${name} ${scalar}${column.notNull ? "" : "?"}`,
		...native === void 0 ? [] : [native],
		...column.default === void 0 ? [] : [`@default(${column.default})`],
		...name === column.name ? [] : [`@map(${JSON.stringify(column.name)})`]
	].join(" ");
};
/**
* Hot Updater's tables as Prisma models, for `prisma db push` or
* `prisma migrate`: keys, indexes, index tables, and the settings table.
* The engine keeps references itself, so the models have no relations.
*/
const generatePrismaEngineSchema = (provider, schema) => shapesOf(provider, schema).map((shape) => {
	const lines = [
		...shape.columns.map((column) => renderField(provider, column)),
		`@@id(${list(shape.key)})`,
		...shape.indexes.flatMap((index) => index.kind === "index" ? [`@@${index.unique ? "unique" : "index"}(${list(index.columns)}, map: ${JSON.stringify(index.name)})`] : [])
	];
	return `model ${shape.name} {\n${lines.map((line) => `  ${line}`).join("\n")}\n}`;
}).join("\n\n");
/**
* The collations Prisma cannot declare, which `hot-updater db migrate` sets
* after Prisma created the tables: `COLLATE "C"` on PostgreSQL and binary
* UTF-8 on MySQL, so strings compare by their bytes as the engine expects.
* The settings table is only read by key, and the migrator has already read
* it: altering it would invalidate PostgreSQL's cached plan for that read.
*/
const prismaCollationStatements = (provider, schema) => {
	if (provider !== "postgresql" && provider !== "mysql") return [];
	const quote = (name) => (0, _hot_updater_plugin_core.quoteSql)(provider, name);
	return shapesOf(provider, schema).filter((shape) => shape.name !== _hot_updater_plugin_core.SETTINGS_TABLE.name).flatMap((shape) => {
		const changes = shape.columns.filter((column) => prismaColumn(provider, column).collate).map((column) => provider === "postgresql" ? `ALTER COLUMN ${quote(column.name)} TYPE ${column.type}` : `MODIFY ${quote(column.name)} ${column.type}${column.notNull ? " NOT NULL" : " NULL"}`);
		return changes.length === 0 ? [] : [`ALTER TABLE ${quote(shape.name)} ${changes.join(", ")}`];
	});
};
//#endregion
exports.generatePrismaEngineSchema = generatePrismaEngineSchema;
exports.prismaCollationStatements = prismaCollationStatements;
