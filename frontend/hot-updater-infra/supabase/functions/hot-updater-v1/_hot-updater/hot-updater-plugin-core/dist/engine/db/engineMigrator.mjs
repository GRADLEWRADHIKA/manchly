import { HOT_UPDATER_SCHEMA_VERSION } from "../core/schema.mjs";
import { getEmptyMigrationResult } from "./fixedMigratorShared.mjs";
import { migrateSchema } from "./schemaSettings.mjs";
import { refuseV0Database, storedSchemaVersion } from "./settingsMigrator.mjs";
//#region src/engine/db/engineMigrator.ts
/**
* `hot-updater db migrate` for a store whose adapter creates its own tables
* (MongoDB and the key-value stores): the tables and indexes, then the
* settings rows, applied when a setting is missing or different, and refused
* on a v0 database.
*/
const createEngineMigrator = (options) => {
	const getVersion = async () => storedSchemaVersion(await options.readSettings());
	const makeResult = async (migrate = {}) => {
		const stored = await options.readSettings();
		refuseV0Database(options.adapterName, stored);
		if (Object.entries(options.settings).every(([key, value]) => stored.get(key) === value)) return getEmptyMigrationResult();
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
			execute: () => migrateSchema(options.adapter, options.adapterName, options.schema.tables, options.settings)
		};
	};
	return {
		getVersion,
		getNameVariants: async () => void 0,
		next: async () => await getVersion() === "1.0.0" ? void 0 : { version: HOT_UPDATER_SCHEMA_VERSION },
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
export { createEngineMigrator };
