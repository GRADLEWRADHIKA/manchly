import { EngineReadCount } from "./engineReads.mjs";
import { EngineDatabase } from "../../types/databaseConfig.mjs";
import { DatabaseReadCount } from "../../database/verifyAdapter.mjs";
//#region src/engine/database/readMeter.d.ts
interface ReadMeasurement<T> {
  readonly result: T;
  /** Point reads and the keys they asked for, and queries and the rows they returned, at the adapter. */
  readonly adapter: DatabaseReadCount;
  /** Reads and the rows (logical rows for aggregates) the engine returned to its callers. */
  readonly engine: EngineReadCount;
}
/**
 * A database whose reads `measureReads` reports, for adapter cost analysis:
 * what each server call costs the store that bills by read.
 */
type MeteredDatabase<TDatabase extends EngineDatabase = EngineDatabase> = TDatabase & {
  /**
   * Runs `read` and reports what the engines on this database read while
   * it ran, at the adapter and at the engine. A process's schema-fence
   * read and retention passes are not part of any call and are not
   * counted.
   */
  measureReads<T>(read: () => Promise<T>): Promise<ReadMeasurement<T>>;
};
/**
 * `database` with read metering, for adapter cost analysis: pass it to
 * `createHotUpdater` or `createEngine`, then `measureReads` reports what a
 * call read at the adapter and at the engine. It works on any database on
 * the storage engine, a provider's included, and every engine on it reports
 * to the same meter.
 */
declare const meterReads: <TDatabase extends EngineDatabase>(database: TDatabase) => MeteredDatabase<TDatabase>;
//#endregion
export { MeteredDatabase, ReadMeasurement, meterReads };