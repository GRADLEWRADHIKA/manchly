import { MongoTransactionUnsupportedError, createMongoAdapter } from "./mongodbAdapter.mjs";
import { SETTINGS_TABLE, createEngineDatabase } from "@hot-updater/plugin-core";
//#region src/adapters/mongodb.ts
/** Settings rows by their `key` field: the engine's rows and a v0 database's alike. */
const readSettings = (client) => async () => {
	const rows = await client.db().collection(SETTINGS_TABLE.name).find({ key: { $type: "string" } }).toArray();
	return new Map(rows.map((row) => [String(row.key), row.value]));
};
/**
* Hot Updater's database on MongoDB: the storage engine's MongoDB adapter,
* fenced by the schema settings. `db migrate` creates the collections and
* indexes, then writes the settings.
*/
const mongoAdapter = (config) => ({
	...createEngineDatabase({
		name: "mongodb",
		adapter: createMongoAdapter({ client: config.client }),
		readSettings: readSettings(config.client)
	}),
	provider: "mongodb"
});
//#endregion
export { MongoTransactionUnsupportedError, mongoAdapter };
