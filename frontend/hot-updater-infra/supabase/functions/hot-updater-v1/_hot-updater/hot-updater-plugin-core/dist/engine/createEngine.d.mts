import { ModuleSchema } from "../serverPlugin/schema.mjs";
import { HotUpdaterDatabase } from "../serverPlugin/databaseHandle.mjs";
import { EngineDatabase } from "../types/databaseConfig.mjs";
import { CoreSchema } from "./core/schema.mjs";
import { PluginTables } from "./db/coreDatabase.mjs";
//#region src/engine/createEngine.d.ts
interface EngineOptions {
  /**
   * The plugins whose tables the engine serves beside core's. On a database
   * from `createEngineDatabase`, each one's `schema.<id>` settings row is
   * checked before the first read or write, as core's are.
   */
  readonly plugins?: readonly PluginTables[];
  /** The clock retention passes and aggregate batching run on; `Date.now` by default. */
  readonly now?: () => number;
}
/** Core's tables and the plugins' on one storage engine. */
interface Engine {
  /** Core's tables: bundles, Releases, Release Catalogs, and channels. */
  readonly core: HotUpdaterDatabase<CoreSchema>;
  /** A plugin's tables, by the plugin `createEngine` was given. */
  database<TSchema extends ModuleSchema>(plugin: {
    readonly id: string;
    readonly schema: TSchema;
  }): HotUpdaterDatabase<TSchema>;
  /**
   * Applies aggregate changes the database batches that are still pending:
   * this process's buffer, and the log rows no compaction has merged yet.
   */
  flush(): Promise<void>;
  /** Stops batching's timer after a last flush. */
  dispose(): Promise<void>;
}
/**
 * The storage engine over a database, as a server runs it: core's tables
 * and the plugins', with the plugins' settings rows fenced on a fenced
 * database, expired rows pruned during writes, aggregates batched when the
 * database batches them, and reads metered when it came from `meterReads`.
 * `createHotUpdater` runs core and its plugins on one; tests and tools run
 * a plugin on one without a server. Wrap the adapter with `verifyAdapter`
 * to check every call against the adapter contract.
 */
declare const createEngine: (database: EngineDatabase, { plugins, now }?: EngineOptions) => Engine;
//#endregion
export { Engine, EngineOptions, createEngine };