import { HotUpdaterConfigError } from "../serverPlugin/configError.mjs";
import { coreModule } from "./core/schema.mjs";
import { aggregateBatchingModule } from "./database/aggregateBatching.mjs";
import { pruneDuringWrites } from "./database/retention.mjs";
import { resolveSchema, validateSchema } from "./database/resolveSchema.mjs";
import { createDatabaseEngine } from "./database/database.mjs";
import { SETTINGS_TABLE, fencedName, withSchemaFence } from "./database/fence.mjs";
import { readMeterOf } from "./database/readMeter.mjs";
import { pluginModule, pluginSettings } from "./db/coreDatabase.mjs";
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
		if (plugin.id === coreModule.id) throw new HotUpdaterConfigError(`Plugin id "${plugin.id}" is core's own.`);
		if (modules.has(plugin.id)) throw new HotUpdaterConfigError(`Plugin "${plugin.id}" is registered twice.`);
		modules.set(plugin.id, pluginModule(plugin));
	}
	if (modules.size > 0) validateSchema([coreModule, ...modules.values()]);
	const name = fencedName(database.adapter);
	const fenced = name === void 0 || plugins.length === 0 ? database.adapter : withSchemaFence(database.adapter, name, pluginSettings(plugins), pluginTablesFix(database));
	const batching = database.aggregateBatching;
	const schema = resolveSchema([
		coreModule,
		...modules.values(),
		...batching === void 0 ? [] : [aggregateBatchingModule]
	]);
	const meter = readMeterOf(database);
	const engine = createDatabaseEngine({
		adapter: pruneDuringWrites(fenced, schema.tables, {
			leaseTable: SETTINGS_TABLE,
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
		core: engine.database(coreModule),
		database: (plugin) => {
			const module = modules.get(plugin.id);
			if (module === void 0) throw new HotUpdaterConfigError(`Plugin "${plugin.id}" is not one of this engine's plugins.`);
			return engine.database(module);
		},
		flush: () => engine.flush(),
		dispose: () => engine.dispose()
	};
};
//#endregion
export { createEngine };
