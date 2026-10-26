Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_mongodbAdapter = require("./mongodbAdapter.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/adapters/mongodb.ts
/** Settings rows by their `key` field: the engine's rows and a v0 database's alike. */
const readSettings = (client) => async () => {
	const rows = await client.db().collection(_hot_updater_plugin_core.SETTINGS_TABLE.name).find({ key: { $type: "string" } }).toArray();
	return new Map(rows.map((row) => [String(row.key), row.value]));
};
/**
* Hot Updater's database on MongoDB: the storage engine's MongoDB adapter,
* fenced by the schema settings. `db migrate` creates the collections and
* indexes, then writes the settings.
*/
const mongoAdapter = (config) => ({
	...(0, _hot_updater_plugin_core.createEngineDatabase)({
		name: "mongodb",
		adapter: require_mongodbAdapter.createMongoAdapter({ client: config.client }),
		readSettings: readSettings(config.client)
	}),
	provider: "mongodb"
});
//#endregion
exports.MongoTransactionUnsupportedError = require_mongodbAdapter.MongoTransactionUnsupportedError;
exports.mongoAdapter = mongoAdapter;
