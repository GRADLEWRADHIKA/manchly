import { MongoTransactionUnsupportedError } from "./mongodbAdapter.cjs";
import { ToolingDatabase } from "@hot-updater/plugin-core";
import { MongoClient } from "mongodb";
//#region src/adapters/mongodb.d.ts
/** Every write runs in a transaction, which needs a replica set or a sharded cluster. */
interface MongoDBConfig {
  readonly client: MongoClient;
}
/**
 * Hot Updater's database on MongoDB: the storage engine's MongoDB adapter,
 * fenced by the schema settings. `db migrate` creates the collections and
 * indexes, then writes the settings.
 */
declare const mongoAdapter: (config: MongoDBConfig) => ToolingDatabase;
//#endregion
export { MongoDBConfig, MongoTransactionUnsupportedError, mongoAdapter };