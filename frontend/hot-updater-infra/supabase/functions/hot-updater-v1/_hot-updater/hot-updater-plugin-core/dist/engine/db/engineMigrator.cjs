const require_schema = require("../core/schema.cjs");
const require_fixedMigratorShared = require("./fixedMigratorShared.cjs");
const require_schemaSettings = require("./schemaSettings.cjs");
const require_settingsMigrator = require("./settingsMigrator.cjs");
//#region src/engine/db/engineMigrator.ts
/**
* `hot-updater db migrate` for a store whose adapter creates its own tables
* (MongoDB and the key-value stores): the tables and indexes, then the
* settings rows, applied when a setting is missing or different, and refused
* on a v0 database.
*/
const createEngineMigrator = (options) => {
	const getVersion = async () => require_settingsMigrator.storedSchemaVersion(await options.readSettings());
	const makeResult = async (migrate = {}) => {
		const stored = await options.readSettings();
		require_settingsMigrator.refuseV0Database(options.adapterName, stored);
		if (Object.entries(options.settings).every(([key, value]) => stored.get(key) === value)) return require_fixedMigratorShared.getEmptyMigrationResult();
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
			execute: () => require_schemaSettings.migrateSchema(options.adapter, options.adapterName, options.schema.tables, options.settings)
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
exports.createEngineMigrator = createEngineMigrator;
