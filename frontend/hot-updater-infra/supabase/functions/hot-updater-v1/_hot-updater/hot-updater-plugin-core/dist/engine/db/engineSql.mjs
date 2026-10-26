import { SETTINGS_TABLE } from "../database/fence.mjs";
import { createTableStatements, quoteSql } from "../database/sql/sqlSchema.mjs";
//#region src/engine/db/engineSql.ts
const literal = (text) => `'${text.replaceAll("'", "''")}'`;
/** Upserts of the settings rows the fence reads. */
const settingsStatements = (dialect, settings, tablePrefix = "") => {
	const quote = (name) => quoteSql(dialect, name);
	const [key, value, version] = [
		"key",
		"value",
		"_v"
	].map(quote);
	return Object.entries(settings).map(([name, text]) => {
		const insert = `INSERT INTO ${quote(tablePrefix + SETTINGS_TABLE.name)} (${key}, ${value}, ${version}) VALUES (${literal(name)}, ${literal(text)}, 0)`;
		return dialect === "mysql" ? `${insert} ON DUPLICATE KEY UPDATE ${value} = VALUES(${value})` : `${insert} ON CONFLICT (${key}) DO UPDATE SET ${value} = excluded.${value}`;
	});
};
/**
* A resolved schema as SQL: its tables and indexes, then the settings rows
* last, so the fence passes only once everything exists. There are no
* database foreign keys: the engine keeps references itself.
*/
const generateEngineSql = (dialect, schema, settings, options = {}) => [...createTableStatements(dialect, [...schema.tables, SETTINGS_TABLE], options.tablePrefix), ...settingsStatements(dialect, settings, options.tablePrefix)];
//#endregion
export { generateEngineSql, settingsStatements };
