import "@hot-updater/plugin-core";
import { MongoClient } from "mongodb";
//#region src/adapters/mongodbAdapter.d.ts
declare class MongoTransactionUnsupportedError extends Error {
  readonly name = "MongoTransactionUnsupportedError";
  constructor(cause: unknown);
}
//#endregion
export { MongoTransactionUnsupportedError };