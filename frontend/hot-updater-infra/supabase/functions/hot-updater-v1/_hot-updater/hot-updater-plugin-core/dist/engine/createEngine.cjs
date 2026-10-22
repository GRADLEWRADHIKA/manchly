const require_configError = require("../serverPlugin/configError.cjs");
const require_schema = require("./core/schema.cjs");
const require_aggregateBatching = require("./database/aggregateBatching.cjs");
const require_retention = require("./database/retention.cjs");
const require_resolveSchema = require("./database/resolveSchema.cjs");
const require_database = require("./database/database.cjs");
const require_fence = require("./database/fence.cjs");
const require_readMeter = require("./database/readMeter.cjs");
const require_coreDatabase = require("./db/coreDatabase.cjs");
//#region src/engine/createEngine.ts
/**
* How to create plugins' tables on a database, by the tooling it offers:
* what the plugins' schema fence names when their settings rows are missing.
*/
const pluginTablesFix = (database) => {
	const { createMigrator, generateSchema } = database;
	const managed = "A managed server runs only its provider's plugins, and rerunning `hot-updater init --provider <provider>` applies the provider's migrations.";
	const serverProject = "Run `hot-updater db` commands in the server's project: they load the server file named on the command line, or src/hotUpdater.* or src/db.*, and don't read hot-updater.config.ts.";
	return createMigrator !== void 0 ? `Run \`hot-updater db migrate\`. ${managed} ${serverProject}` : generateSchema !== void 0 ? `Run \`hot-updater db generate\` and apply the file it writes. ${managed} ${serverProject}` : managed;
};
/**
* The storage engine over a database, as a server runs it: core's tables
* and the plugins', with the plugins' settings rows fenced on a fenced
* database, expired rows pruned during writes, aggregates batched when the
* database batches them, and reads metered when it came from `meterReads`.
* `createHotUpdater` runs core and its plugins on one; tests and tools run
* a plugin on one without a server. Wrap the adapter with `verifyAdapter`
* to check every call against the adapter contract.
*/
const createEngine = (database, { plugins = [], now = Date.now } = {}) => {
	const modules = /* @__PURE__ */ new Map();
	for (const plugin of plugins) {
		if (plugin.id === require_schema.coreModule.id) throw new require_configError.HotUpdaterConfigError(`Plugin id "${plugin.id}" is core's own.`);
		if (modules.has(plugin.id)) throw new require_configError.HotUpdaterConfigError(`Plugin "${plugin.id}" is registered twice.`);
		modules.set(plugin.id, require_coreDatabase.pluginModule(plugin));
	}
	if (modules.size > 0) require_resolveSchema.validateSchema([require_schema.coreModule, ...modules.values()]);
	const name = require_fence.fencedName(database.adapter);
	const fenced = name === void 0 || plugins.length === 0 ? database.adapter : require_fence.withSchemaFence(database.adapter, name, require_coreDatabase.pluginSettings(plugins), pluginTablesFix(database));
	const batching = database.aggregateBatching;
	const schema = require_resolveSchema.resolveSchema([
		require_schema.coreModule,
		...modules.values(),
		...batching === void 0 ? [] : [require_aggregateBatching.aggregateBatchingModule]
	]);
	const meter = require_readMeter.readMeterOf(database);
	const engine = require_database.createDatabaseEngine({
		adapter: require_retention.pruneDuringWrites(fenced, schema.tables, {
			leaseTable: require_fence.SETTINGS_TABLE,
			now
		}),
		schema,
		...database.retry === void 0 ? {} : { retry: database.retry },
		...batching === void 0 ? {} : {
			batching,
			now
		},
		...meter === void 0 ? {} : { meter }
	});
	return {
		core: engine.database(require_schema.coreModule),
		database: (plugin) => {
			const module = modules.get(plugin.id);
			if (module === void 0) throw new require_configError.HotUpdaterConfigError(`Plugin "${plugin.id}" is not one of this engine's plugins.`);
			return engine.database(module);
		},
		flush: () => engine.flush(),
		dispose: () => engine.dispose()
	};
};
//#endregion
exports.createEngine = createEngine;
