import { DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS } from "./drizzleExecutor.mjs";
import { SqlDialect, ToolingDatabase } from "@hot-updater/plugin-core";
//#region src/adapters/drizzle.d.ts
type DrizzleProvider = SqlDialect;
interface DrizzleConfig {
  /** A Drizzle database, or a function that returns one on first use. */
  readonly db: unknown | (() => unknown | Promise<unknown>);
  readonly provider: DrizzleProvider;
}
/**
 * Hot Updater's database on a Drizzle instance: the storage engine through the
 * shared SQL core, fenced by the schema settings. `db generate` writes the
 * Drizzle schema drizzle-kit applies; `db migrate` then writes the settings
 * rows the fence checks.
 */
declare const drizzleAdapter: (config: DrizzleConfig) => ToolingDatabase;
//#endregion
export { DrizzleConfig, DrizzleProvider, DrizzleTransactionUnsupportedError, SUPPORTED_DRIZZLE_DRIVERS, drizzleAdapter };