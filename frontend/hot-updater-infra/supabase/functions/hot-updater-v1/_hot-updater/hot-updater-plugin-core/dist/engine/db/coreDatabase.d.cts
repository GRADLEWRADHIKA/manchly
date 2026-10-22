import { DatabaseAdapter, PhysicalTable } from "../../database/adapter.cjs";
import { ModelShape } from "../../serverPlugin/definitions.cjs";
import { ResolvedSchema } from "../database/resolveSchema.cjs";
import { RetryOptions } from "../database/engineTransaction.cjs";
import { AggregateBatching } from "../../types/databaseConfig.cjs";
import { SchemaSettings } from "../database/fence.cjs";
import { ToolingDatabase, ToolingTarget } from "./types.cjs";
import "../../index.cjs";
//#region src/engine/db/coreDatabase.d.ts
/** Core's tables: the tables every provider's tooling creates. */
declare const coreSchema: ResolvedSchema;
/** The settings rows a provider's database is fenced by. */
declare const coreSettings: SchemaSettings;
/** What `hot-updater db` creates for a server without plugins. */
declare const coreTarget: ToolingTarget;
/**
 * The log and lease tables a database with `aggregateBatching` writes
 * beside core's and the plugins', which a provider's access policy names,
 * such as the managed AWS server's IAM role.
 */
declare const aggregateBatchingTables: readonly PhysicalTable[];
/** A plugin as the tooling reads it: its id, its tables, and their version. */
interface PluginTables {
  readonly id: string;
  readonly schemaVersion: string;
  readonly schema: Readonly<Record<string, ModelShape>>;
  /** `false` keeps the declared table names instead of prefixing them with the id. */
  readonly namespace?: false;
}
/**
 * What `hot-updater db` creates for a server's plugins: core's tables, then
 * each plugin's tables with its `schema.<id>` settings row.
 */
declare const toolingTargetOf: (plugins: readonly PluginTables[]) => ToolingTarget;
/**
 * Creates core's tables and those of `plugins`, then writes their settings
 * rows: what a provider's setup runs for the plugins its server runs.
 */
declare const migrateCoreSchema: (adapter: DatabaseAdapter, name: string, plugins?: readonly PluginTables[]) => Promise<void>;
/** `createEngineDatabase`'s options. */
interface EngineDatabaseOptions {
  readonly name: string;
  readonly adapter: DatabaseAdapter;
  /**
   * Purges a CDN's copies of the cacheable client routes. Core calls it after
   * a committed write that changes what those routes answer, since only core
   * knows which of its tables they read.
   */
  readonly onCachedRoutesChange?: () => Promise<void>;
  /**
   * Batches aggregates declared `batched`, for stores that bill each write;
   * `false` or absent commits them with each transaction.
   */
  readonly aggregateBatching?: AggregateBatching | false;
  /**
   * How a transaction that conflicts with another write runs again: more
   * attempts for a store many writers contend on, and `onRetry` to observe
   * each rerun. 8 attempts by default.
   */
  readonly retry?: RetryOptions;
  /**
   * How `hot-updater db migrate` reads the stored settings rows, by key; by
   * default the engine's keys through the adapter. An adapter whose v0
   * database kept other settings rows reads every row itself, so the
   * migrator refuses a v0 database.
   */
  readonly readSettings?: () => Promise<ReadonlyMap<string, unknown>>;
}
/**
 * A provider's database on the storage engine: its adapter behind the schema
 * fence, which checks core's settings rows before the first read or write
 * and names `hot-updater db migrate` when they are missing or stale. When the
 * adapter creates its own tables, `hot-updater db migrate` creates core's
 * tables and the server's plugin tables, then writes their settings rows.
 */
declare const createEngineDatabase: ({ name, adapter, onCachedRoutesChange, aggregateBatching, retry, readSettings: readStored }: EngineDatabaseOptions) => ToolingDatabase;
//#endregion
export { EngineDatabaseOptions, PluginTables, aggregateBatchingTables, coreSchema, coreSettings, coreTarget, createEngineDatabase, migrateCoreSchema, toolingTargetOf };