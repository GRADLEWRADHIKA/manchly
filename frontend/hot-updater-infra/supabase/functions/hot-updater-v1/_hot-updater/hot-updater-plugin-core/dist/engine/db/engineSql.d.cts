import { ResolvedSchema } from "../database/resolveSchema.cjs";
import { SchemaSettings } from "../database/fence.cjs";
import { SqlDialect } from "../database/sql/sqlSchema.cjs";
//#region src/engine/db/engineSql.d.ts
/** `generateEngineSql`'s and `createEngineSqlMigrator`'s options. */
interface EngineSqlOptions {
  readonly tablePrefix?: string;
}
/**
 * A resolved schema as SQL: its tables and indexes, then the settings rows
 * last, so the fence passes only once everything exists. There are no
 * database foreign keys: the engine keeps references itself.
 */
declare const generateEngineSql: (dialect: SqlDialect, schema: ResolvedSchema, settings: SchemaSettings, options?: EngineSqlOptions) => string[];
//#endregion
export { EngineSqlOptions, generateEngineSql };