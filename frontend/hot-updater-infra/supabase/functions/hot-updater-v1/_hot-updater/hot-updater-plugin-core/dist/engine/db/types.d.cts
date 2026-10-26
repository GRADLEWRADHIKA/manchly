import { ResolvedSchema } from "../database/resolveSchema.cjs";
import { EngineDatabase } from "../../types/databaseConfig.cjs";
import { SchemaSettings } from "../database/fence.cjs";
//#region src/engine/db/types.d.ts
declare const providers: readonly ["sqlite", "mysql", "postgresql", "mongodb"];
type ORMProvider = (typeof providers)[number];
/** What a `Migrator`'s migrations take. */
interface MigrateOptions {
  updateSettings?: boolean;
  unsafe?: boolean;
}
type MigrationOperation = {
  type: "create-table";
  value: {
    ormName: string;
    columns: Record<string, {
      ormName: string;
      type: string;
    }>;
  };
} | {
  type: "custom";
  description: string;
} | {
  type: "custom";
  sql: string;
} | {
  type: "custom";
  key: string;
  value: unknown;
};
/** A `Migrator`'s planned migration: its operations, its SQL, and how to run it. */
interface MigrationResult {
  operations: MigrationOperation[];
  execute: () => Promise<void>;
  getSQL?: () => string;
}
interface Migrator {
  getVersion: () => Promise<string | undefined>;
  getNameVariants: () => Promise<unknown>;
  next: () => Promise<{
    version: string;
  } | undefined>;
  previous: () => Promise<{
    version: string;
  } | undefined>;
  up: (options?: MigrateOptions) => Promise<MigrationResult>;
  down: (options?: MigrateOptions) => Promise<MigrationResult>;
  migrateTo: (version: string, options?: MigrateOptions) => Promise<MigrationResult>;
  migrateToLatest: (options?: MigrateOptions) => Promise<MigrationResult>;
}
/**
 * The tables `db migrate` and `db generate` create and the settings rows they
 * write: core's, and those of each plugin the server runs.
 */
interface ToolingTarget {
  readonly schema: ResolvedSchema;
  readonly settings: SchemaSettings;
}
type SchemaGenerator = (version: string | "latest", name?: string, target?: ToolingTarget) => {
  code: string;
  path: string;
};
/**
 * What `hot-updater db generate` and `db migrate` run for a provider's
 * database, beside the database itself. Without a target they cover core's
 * tables.
 */
interface DatabaseTooling {
  readonly provider?: ORMProvider;
  readonly createMigrator?: (target?: ToolingTarget) => Migrator;
  readonly generateSchema?: SchemaGenerator;
}
/** A provider's database on the storage engine, with its tooling. */
type ToolingDatabase = EngineDatabase & DatabaseTooling;
//#endregion
export { DatabaseTooling, MigrateOptions, MigrationOperation, MigrationResult, Migrator, ORMProvider, SchemaGenerator, ToolingDatabase, ToolingTarget, providers };