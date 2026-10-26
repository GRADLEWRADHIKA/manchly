import { SchemaSettings } from "../database/fence.cjs";
import { Migrator } from "./types.cjs";
import { SqlExecutor } from "../database/sql/sqlAdapter.cjs";
//#region src/engine/db/settingsMigrator.d.ts
/**
 * `hot-updater db migrate` for an ORM that applies the DDL itself (Drizzle,
 * Prisma): it sets what the ORM cannot declare, writes the settings rows, and
 * refuses a v0 database. The `createMigrator` of an adapter whose ORM
 * creates the tables returns it, as the Drizzle and Prisma adapters' do.
 */
declare const createSettingsMigrator: (options: {
  readonly adapterName: string;
  readonly executor: SqlExecutor;
  readonly settings: SchemaSettings;
  /** How the ORM applies the tables, for the error when they are missing. */
  readonly applyTables: string;
  /** What the ORM cannot declare, set before the settings rows. */
  readonly fixups?: {
    readonly description: string;
    readonly statements: readonly string[];
  };
}) => Migrator;
//#endregion
export { createSettingsMigrator };