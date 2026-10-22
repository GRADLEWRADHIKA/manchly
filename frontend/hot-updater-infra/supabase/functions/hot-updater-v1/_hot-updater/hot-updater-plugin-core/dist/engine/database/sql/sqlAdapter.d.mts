import { DatabaseAdapter, PhysicalTable } from "../../../database/adapter.mjs";
import { SqlDialect, createTableStatements } from "./sqlSchema.mjs";
//#region src/engine/database/sql/sqlAdapter.d.ts
interface SqlStatement {
  readonly sql: string;
  readonly params: readonly unknown[];
}
interface SqlResult {
  readonly rows: readonly Record<string, unknown>[];
  /** Rows an INSERT, UPDATE, or DELETE changed. */
  readonly changes: number;
}
interface SqlConnection {
  execute(statement: SqlStatement): Promise<SqlResult>;
}
/** One per driver or ORM: runs statements, and runs a callback in one transaction. */
interface SqlExecutor extends SqlConnection {
  readonly dialect: SqlDialect;
  /** Commits when `fn` resolves and rolls back when it throws; SQLite begins with BEGIN IMMEDIATE. */
  transaction<T>(fn: (connection: SqlConnection) => Promise<T>): Promise<T>;
  /**
   * Runs statements as one atomic batch. When set, writes use it instead of
   * `transaction`, for drivers without interactive transactions (D1).
   */
  batch?(statements: readonly SqlStatement[]): Promise<readonly SqlResult[]>;
}
/** `createSqlAdapter`'s options. */
interface SqlAdapterOptions {
  readonly executor: SqlExecutor;
  /** Prepended to every table name. */
  readonly tablePrefix?: string;
  /** The most ops one write accepts (default 1,000). */
  readonly maxOps?: number;
  /** The most parameters one statement binds (D1: 100); a batch read splits to fit. */
  readonly maxParams?: number;
}
/** Where a batch write records its first failed op, before any change applies. */
declare const WRITE_GUARD_TABLE: PhysicalTable;
/**
 * The shared SQL core over one executor: each write compiles to statements
 * run in one transaction, or in one atomic batch where the executor batches.
 */
declare const createSqlAdapter: ({ executor, tablePrefix, maxOps, maxParams }: SqlAdapterOptions) => DatabaseAdapter;
//#endregion
export { SqlAdapterOptions, SqlConnection, SqlExecutor, SqlResult, SqlStatement, WRITE_GUARD_TABLE, createSqlAdapter };