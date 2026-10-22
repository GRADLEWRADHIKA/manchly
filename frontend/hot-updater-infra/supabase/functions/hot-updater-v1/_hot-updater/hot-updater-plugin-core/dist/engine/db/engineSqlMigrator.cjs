const require_schema = require("../core/schema.cjs");
const require_fixedMigratorShared = require("./fixedMigratorShared.cjs");
const require_engineSql = require("./engineSql.cjs");
const require_settingsMigrator = require("./settingsMigrator.cjs");
//#region src/engine/db/engineSqlMigrator.ts
/** Runs the statements in one transaction where the dialect's DDL is transactional. */
const run = async (executor, statements) => {
	const each = async (connection) => {
		for (const sql of statements) await connection.execute({
			sql,
			params: []
		});
	};
	await (executor.dialect === "mysql" ? each(executor) : executor.transaction(each));
};
/**
* `hot-updater db migrate` and `db generate` for an SQL provider on the
* engine: the generated SQL schema, applied when a settings row is missing or
* different, and refused on a v0 database. A SQL adapter's `createMigrator`
* returns it, as `kyselyAdapter`'s does.
*/
const createEngineSqlMigrator = (options) => {
	/** No settings table yet reads as an empty database. */
	const read = async () => await require_settingsMigrator.readStoredSettings(options.executor, options.tablePrefix) ?? /* @__PURE__ */ new Map();
	const getVersion = async () => require_settingsMigrator.storedSchemaVersion(await read());
	const makeResult = async (migrate = {}) => {
		const stored = await read();
		require_settingsMigrator.refuseV0Database(options.adapterName, stored);
		if (Object.entries(options.settings).every(([key, value]) => stored.get(key) === value)) return require_fixedMigratorShared.getEmptyMigrationResult();
		const statements = require_engineSql.generateEngineSql(options.executor.dialect, options.schema, options.settings, options);
		return {
			operations: [...options.schema.tables.map((table) => ({
				type: "create-table",
				value: {
					ormName: table.name,
					columns: Object.fromEntries(table.columns.map((column) => [column.name, {
						ormName: column.name,
						type: column.type
					}]))
				}
			})), ...migrate.updateSettings === false ? [] : [{
				type: "custom",
				description: `Write the schema settings: ${Object.keys(options.settings).join(", ")}`
			}]],
			getSQL: () => statements.map((statement) => `${statement};`).join("\n\n"),
			execute: () => run(options.executor, statements)
		};
	};
	return {
		getVersion,
		getNameVariants: async () => void 0,
		next: async () => await getVersion() === "1.0.0" ? void 0 : { version: require_schema.HOT_UPDATER_SCHEMA_VERSION },
		previous: async () => void 0,
		up: makeResult,
		down: async () => {
			throw new Error("No previous schema to migrate to.");
		},
		migrateTo: async (version, migrate) => {
			if (version !== "1.0.0") throw new Error(`Invalid version ${version}`);
			return makeResult(migrate);
		},
		migrateToLatest: makeResult
	};
};
//#endregion
exports.createEngineSqlMigrator = createEngineSqlMigrator;
