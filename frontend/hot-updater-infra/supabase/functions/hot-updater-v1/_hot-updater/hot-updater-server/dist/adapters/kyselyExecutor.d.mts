import { SqlDialect, SqlExecutor } from "@hot-updater/plugin-core";
import { Kysely } from "kysely";
//#region src/adapters/kyselyExecutor.d.ts
/**
 * The SQL core's executor over a Kysely instance: statements run as raw
 * compiled queries. SQLite transactions begin with BEGIN IMMEDIATE on one
 * connection; other dialects use Kysely's transactions.
 */
declare const kyselyExecutor: (db: Kysely<object>, dialect: SqlDialect) => SqlExecutor;
//#endregion
export { kyselyExecutor };