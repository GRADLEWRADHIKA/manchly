import { ResolvedSchema } from "../database/resolveSchema.cjs";
import { SchemaSettings } from "../database/fence.cjs";
import { Migrator } from "./types.cjs";
import { SqlExecutor } from "../database/sql/sqlAdapter.cjs";
import { EngineSqlOptions } from "./engineSql.cjs";
//#region src/engine/db/engineSqlMigrator.d.ts
interface EngineSqlMigratorOptions extends EngineSqlOptions {
  readonly adapterName: string;
  readonly executor: SqlExecutor;
  readonly schema: ResolvedSchema;
  readonly settings: SchemaSettings;
}
/**
 * `hot-updater db migrate` and `db generate` for an SQL provider on the
 * engine: the generated SQL schema, applied when a settings row is missing or
 * different, and refused on a v0 database. A SQL adapter's `createMigrator`
 * returns it, as `kyselyAdapter`'s does.
 */
declare const createEngineSqlMigrator: (options: EngineSqlMigratorOptions) => Migrator;
//#endregion
export { EngineSqlMigratorOptions, createEngineSqlMigrator };