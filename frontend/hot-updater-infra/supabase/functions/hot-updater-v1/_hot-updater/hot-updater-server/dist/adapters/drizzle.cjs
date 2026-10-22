Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_sqlProviders = require("./sqlProviders.cjs");
const require_engineDrizzleSchema = require("../db/engineDrizzleSchema.cjs");
const require_drizzleExecutor = require("./drizzleExecutor.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/adapters/drizzle.ts
/**
* Hot Updater's database on a Drizzle instance: the storage engine through the
* shared SQL core, fenced by the schema settings. `db generate` writes the
* Drizzle schema drizzle-kit applies; `db migrate` then writes the settings
* rows the fence checks.
*/
const drizzleAdapter = (config) => {
	const provider = require_sqlProviders.checkSqlProvider("drizzleAdapter", config.provider);
	const executor = require_drizzleExecutor.drizzleExecutor(config.db, provider);
	return {
		...(0, _hot_updater_plugin_core.createEngineDatabase)({
			name: "drizzle",
			adapter: (0, _hot_updater_plugin_core.createSqlAdapter)({ executor })
		}),
		provider,
		generateSchema: ((version, _name, { schema } = _hot_updater_plugin_core.coreTarget) => {
			if (version !== "latest" && version !== _hot_updater_plugin_core.coreSettings["schema.core"]) throw new Error(`Invalid version ${version}`);
			return {
				code: require_engineDrizzleSchema.generateDrizzleEngineSchema(provider, schema),
				path: "hot-updater-schema.ts"
			};
		}),
		createMigrator: ({ settings } = _hot_updater_plugin_core.coreTarget) => (0, _hot_updater_plugin_core.createSettingsMigrator)({
			adapterName: "drizzle",
			executor,
			settings,
			applyTables: "`drizzle-kit push` (or your drizzle-kit migrations)"
		})
	};
};
//#endregion
exports.DrizzleTransactionUnsupportedError = require_drizzleExecutor.DrizzleTransactionUnsupportedError;
exports.SUPPORTED_DRIZZLE_DRIVERS = require_drizzleExecutor.SUPPORTED_DRIZZLE_DRIVERS;
exports.drizzleAdapter = drizzleAdapter;
