import { ResolvedSchema } from "../database/resolveSchema.mjs";
import { SchemaSettings } from "../database/fence.mjs";
import { Migrator } from "./types.mjs";
import { SqlExecutor } from "../database/sql/sqlAdapter.mjs";
import { EngineSqlOptions } from "./engineSql.mjs";
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