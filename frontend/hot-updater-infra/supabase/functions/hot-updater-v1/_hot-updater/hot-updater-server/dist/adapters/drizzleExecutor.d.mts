import { SqlDialect, SqlExecutor } from "@hot-updater/plugin-core";
//#region src/adapters/drizzleExecutor.d.ts
declare const SUPPORTED_DRIZZLE_DRIVERS = "node-postgres, postgres-js, PGlite, or Neon over WebSockets for PostgreSQL; mysql2 for MySQL; libSQL, better-sqlite3, or bun:sqlite for SQLite";
declare class DrizzleTransactionUnsupportedError extends Error {
  readonly name = "DrizzleTransactionUnsupportedError";
  constructor(cause: unknown);
}
//#endregion
export { DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS };