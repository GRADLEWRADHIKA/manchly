import { DatabaseAdapter } from "./adapter.mjs";
//#region src/database/verifyAdapter.d.ts
/** What `verifyAdapter` throws when an adapter call breaks the adapter contract. */
declare class DatabaseAdapterContractError extends Error {
  readonly name = "DatabaseAdapterContractError";
}
/**
 * Reads at the adapter, as `verifyAdapter` and `meterReads` count them:
 * what a store that bills by read charges for.
 */
interface DatabaseReadCount {
  /** `get` calls and the keys they asked for, found or not. */
  readonly gets: number;
  readonly keys: number;
  /** `query` calls, zero-row calls included, and the rows they returned. */
  readonly queries: number;
  readonly rows: number;
}
/** The read count of a `verifyAdapter` adapter, in total and by table. */
interface DatabaseReadMeter {
  total(): DatabaseReadCount;
  byTable(table: string): DatabaseReadCount;
  reset(): void;
}
/** The adapter `verifyAdapter` returns, with its reads counted. */
interface VerifiedDatabaseAdapter extends DatabaseAdapter {
  readonly reads: DatabaseReadMeter;
}
/** `verifyAdapter`'s options. */
interface VerifyAdapterOptions {
  /** After a short page, probe once past its last row to prove the range ended. */
  readonly probeShortPages?: boolean;
}
/** Wraps an adapter to check the contract at its boundary and count reads. */
declare const verifyAdapter: (adapter: DatabaseAdapter, options?: VerifyAdapterOptions) => VerifiedDatabaseAdapter;
//#endregion
export { DatabaseAdapterContractError, DatabaseReadCount, DatabaseReadMeter, VerifiedDatabaseAdapter, VerifyAdapterOptions, verifyAdapter };