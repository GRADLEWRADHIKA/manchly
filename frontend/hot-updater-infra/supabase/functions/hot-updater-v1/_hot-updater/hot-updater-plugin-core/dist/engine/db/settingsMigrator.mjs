import { HOT_UPDATER_SCHEMA_VERSION } from "../core/schema.mjs";
import { HotUpdaterSchemaMigrationRequiredError, SETTINGS_TABLE, isMissingSchemaError } from "../database/fence.mjs";
import { getEmptyMigrationResult } from "./fixedMigratorShared.mjs";
import { quoteSql } from "../database/sql/sqlSchema.mjs";
import { settingsStatements } from "./engineSql.mjs";
//#region src/engine/db/settingsMigrator.ts
/**
* Every settings row by key and value alone, so a v0 layout reads too; null
* when the settings table is missing.
*/
const readStoredSettings = async (executor, tablePrefix = "") => {
	const quote = (name) => quoteSql(executor.dialect, name);
	try {
		const { rows } = await executor.execute({
			sql: `SELECT ${quote("key")}, ${quote("value")} FROM ${quote(tablePrefix + SETTINGS_TABLE.name)}`,
			params: []
		});
		return new Map(rows.map((row) => [String(row.key), row.value]));
	} catch (error) {
		if (!isMissingSchemaError(error)) throw error;
		return null;
	}
};
/** `schema.core`, or a v0 database's `version`. */
const storedSchemaVersion = (stored) => {
	const version = stored?.get("schema.core") ?? stored?.get("version");
	return typeof version === "string" ? version : void 0;
};
/**
* A v0 database, whose settings hold `version` and no `schema.engine`, is
* recreated, never converted.
*/
const refuseV0Database = (adapterName, stored) => {
	const version = stored.get("version");
	if (typeof version !== "string" || stored.has("schema.engine")) return;
	throw new HotUpdaterSchemaMigrationRequiredError(adapterName, version);
};
/**
* `hot-updater db migrate` for an ORM that applies the DDL itself (Drizzle,
* Prisma): it sets what the ORM cannot declare, writes the settings rows, and
* refuses a v0 database. The `createMigrator` of an adapter whose ORM
* creates the tables returns it, as the Drizzle and Prisma adapters' do.
*/
const createSettingsMigrator = (options) => {
	const read = () => readStoredSettings(options.executor);
	const getVersion = async () => storedSchemaVersion(await read());
	const makeResult = async (migrate = {}) => {
		const stored = await read();
		if (stored === null) throw new Error(`${options.adapterName}: the Hot Updater tables are missing. Run \`hot-updater db generate\`, apply the schema with ${options.applyTables}, then migrate again.`);
		refuseV0Database(options.adapterName, stored);
		if (migrate.updateSettings === false || Object.entries(options.settings).every(([key, value]) => stored.get(key) === value)) return getEmptyMigrationResult();
		const fixups = options.fixups?.statements ?? [];
		const statements = [...fixups, ...settingsStatements(options.executor.dialect, options.settings)];
		return {
			operations: [...fixups.length === 0 ? [] : [{
				type: "custom",
				description: options.fixups.description
			}], {
				type: "custom",
				description: `Write the schema settings: ${Object.keys(options.settings).join(", ")}`
			}],
			getSQL: () => statements.map((statement) => `${statement};`).join("\n\n"),
			execute: async () => {
				for (const sql of statements) await options.executor.execute({
					sql,
					params: []
				});
			}
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
export { createSettingsMigrator, readStoredSettings, refuseV0Database, storedSchemaVersion };
