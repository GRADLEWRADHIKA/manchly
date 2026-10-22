import { PhysicalIndex, PhysicalTable } from "../../../database/adapter.mjs";
//#region src/engine/database/sql/sqlSchema.d.ts
type SqlDialect = "postgresql" | "mysql" | "sqlite";
/**
 * Quotes an identifier: backticks on MySQL, double quotes elsewhere. An ORM
 * schema generator, or an executor that issues statements of its own, quotes
 * names as the SQL core does with it, as the Prisma adapter's do.
 */
declare const quoteSql: (dialect: SqlDialect, name: string) => string;
declare const isMultiIndex: (table: PhysicalTable, index: PhysicalIndex) => boolean;
/** A column of a `SqlTableShape`. */
interface SqlColumnShape {
  readonly name: string;
  /** The column's DDL type, collation included. */
  readonly type: string;
  readonly notNull: boolean;
  readonly default?: number;
}
/** A table as the DDL creates it, which an ORM schema generator renders. */
interface SqlTableShape {
  readonly name: string;
  readonly columns: readonly SqlColumnShape[];
  readonly key: readonly string[];
  /** Indexes, and index tables for multi-valued fields, in declaration order. */
  readonly indexes: readonly ({
    readonly kind: "index";
    readonly name: string;
    readonly unique: boolean;
    readonly columns: readonly string[];
  } | {
    readonly kind: "table";
    readonly table: SqlTableShape;
  })[];
}
/**
 * Each table as the DDL creates it, for the DDL below and for ORM schema
 * generators, such as the Drizzle and Prisma adapters': binary collation, one index per declared index, and an index
 * table `<table>__<index>` for each index over a multi-valued field, keyed by
 * every column it holds.
 */
declare const sqlTableShapes: (dialect: SqlDialect, tables: readonly PhysicalTable[], tablePrefix?: string) => SqlTableShape[];
/** DDL for the tables' shapes: each table, then its indexes and index tables. */
declare const createTableStatements: (dialect: SqlDialect, tables: readonly PhysicalTable[], tablePrefix?: string) => string[];
//#endregion
export { SqlColumnShape, SqlDialect, SqlTableShape, createTableStatements, isMultiIndex, quoteSql, sqlTableShapes };