import { DatabaseAdapter, DatabaseKeyValue, StoredRow, WriteResult } from "../../../database/adapter.mjs";
//#region src/engine/database/kv/kvAdapter.d.ts
/** An item's address: a partition, and a sort key within it. */
interface KvKey {
  readonly pk: string;
  readonly sk: string;
}
/** What an op requires of its item before the write: that it exists or not, or that its `_v` is `v`. */
type KvCondition = {
  readonly exists: boolean;
} | {
  readonly v: number;
};
type KvOp = {
  readonly key: KvKey;
  readonly condition?: KvCondition;
  /**
   * When a put's or a created item expires, in epoch milliseconds, which
   * the store maps to its native TTL. Every item of a row of a table with
   * retention carries it, index copies included.
   */
  readonly expiresAt?: number;
} & ({
  readonly type: "put";
  readonly value: StoredRow;
} | {
  readonly type: "delete";
} | {
  readonly type: "check";
} |
/** Adds to numeric attributes, creating the item from `init` when it is missing. */
{
  readonly type: "add";
  readonly by: Readonly<Record<string, number>>;
  readonly init?: StoredRow;
});
/** Sort keys from `gte` up to `lt` in one partition, resuming past `after`. */
interface KvRange {
  readonly pk: string;
  readonly gte?: string;
  readonly lt?: string;
  /**
   * `lt` as an inclusive bound, with `lt`: every key the helper writes is
   * below `lt` exactly when it is at most `lte`. A store whose two-sided
   * range is inclusive (DynamoDB's `BETWEEN`) uses it to read nothing past
   * the range.
   */
  readonly lte?: string;
  readonly order: "asc" | "desc";
  readonly limit: number;
  readonly after?: string;
}
interface KvItem {
  readonly sk: string;
  readonly value: StoredRow;
}
/**
 * A key-value backend (DynamoDB, Firestore): strongly consistent point
 * reads, one partition's sort-key range per page, and atomic writes whose
 * conditions all see the state before the write. Sort keys compare as UTF-8.
 */
interface KeyValueStore {
  readonly id: string;
  /**
   * The most items, and bytes, one atomic write takes; `itemBytes` caps each
   * item, and `keyBytes` the partition and sort keys the store indexes whole.
   */
  readonly limits: {
    readonly items: number;
    readonly bytes: number;
    readonly itemBytes?: number;
    readonly keyBytes?: {
      readonly pk: number;
      readonly sk: number;
    };
  };
  get(keys: readonly KvKey[]): Promise<readonly (StoredRow | null)[]>;
  /** One native page; `more` when the range may go on past it. An empty page ends the range. */
  query(range: KvRange): Promise<{
    readonly items: readonly KvItem[];
    readonly more: boolean;
  }>;
  /** Applies every op or none; `failedOp` names an op whose condition failed. */
  write(ops: readonly KvOp[]): Promise<WriteResult>;
  /** Deletes items with no condition and not atomically, a batch at a time. */
  deleteConsumed?(keys: readonly KvKey[]): Promise<void>;
  /** Prepares the store, such as its one table, for `db migrate`. */
  readonly migrations?: {
    apply(): Promise<void>;
  };
  dispose?(): Promise<void>;
}
/**
 * Order-preserving text for key values; each value ends in the lowest code
 * point any encoding uses. `createKvAdapter` stores a row as the item with
 * the table's name as `pk` and its key's text as `sk`, so tooling that
 * writes a store's items itself, as the AWS setup's settings items do, keys
 * them with it.
 */
declare const encodeKvKey: (values: readonly DatabaseKeyValue[]) => string;
/** `createKvAdapter`'s options. */
interface KvAdapterOptions {
  readonly store: KeyValueStore;
  readonly tablePrefix?: string;
}
/**
 * The database adapter over a key-value store. A row is one item at
 * `pk = <table>`, `sk = enc(key)`; each index not in key order adds an item
 * per entry at `pk = <table>#<index>#enc(eq)`, `sk = enc(order)`, and each
 * unique entry one item at `sk = "#"`, written only where no other row holds
 * it. Index items hold a copy of the row without `_v` or counters, so an
 * increment, which changes only those, never makes them stale.
 */
declare const createKvAdapter: ({ store, tablePrefix }: KvAdapterOptions) => DatabaseAdapter;
//#endregion
export { KeyValueStore, KvAdapterOptions, KvCondition, KvItem, KvKey, KvOp, KvRange, createKvAdapter, encodeKvKey };