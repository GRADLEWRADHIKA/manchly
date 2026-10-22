import { DatabaseAdapter } from "./adapter.mjs";
//#region src/database/memoryAdapter.d.ts
/** `createMemoryAdapter`'s options. */
interface MemoryAdapterOptions {
  /** Prefixes every table's name, so several servers can share one store. */
  readonly tablePrefix?: string;
}
/**
 * The reference adapter: every read is a consistent snapshot and every write
 * applies to a copy that replaces the state only when all ops succeed.
 */
declare const createMemoryAdapter: (options?: MemoryAdapterOptions) => DatabaseAdapter;
//#endregion
export { MemoryAdapterOptions, createMemoryAdapter };