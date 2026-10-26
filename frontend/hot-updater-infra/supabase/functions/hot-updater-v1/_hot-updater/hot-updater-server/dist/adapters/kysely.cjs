Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_kyselyExecutor = require("./kyselyExecutor.cjs");
const require_sqlProviders = require("./sqlProviders.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/adapters/kysely.ts
/**
* Hot Updater's database on a Kysely instance: the storage engine through the
* shared SQL core, fenced by the schema settings. `db migrate` and
* `db generate --sql` apply the engine's SQL schema.
*/
const kyselyAdapter = (config) => {
	const provider = require_sqlProviders.checkSqlProvider("kyselyAdapter", config.provider);
	const executor = require_kyselyExecutor.kyselyExecutor(config.db, provider);
	return {
		...(0, _hot_updater_plugin_core.createEngineDatabase)({
			name: "kysely",
			adapter: (0, _hot_updater_plugin_core.createSqlAdapter)({ executor })
		}),
		provider,
		createMigrator: ({ schema, settings } = _hot_updater_plugin_core.coreTarget) => (0, _hot_updater_plugin_core.createEngineSqlMigrator)({
			adapterName: "kysely",
			executor,
			schema,
			settings
		})
	};
};
//#endregion
exports.kyselyAdapter = kyselyAdapter;
exports.kyselyExecutor = require_kyselyExecutor.kyselyExecutor;
