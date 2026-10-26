import { PhysicalTable } from "../../database/adapter.cjs";
//#region src/engine/database/fence.d.ts
/**
 * The settings rows migrations write, last, and the fence reads; retention
 * passes keep their lease here too. Tooling that creates the tables creates
 * this one with them: an ORM's schema generator, a provider's setup, and an
 * access policy that names the tables a server reads.
 */
declare const SETTINGS_TABLE: PhysicalTable;
/** A schema setting the fence found missing or different. */
interface SchemaSettingMismatch {
  readonly key: string;
  readonly expected: string;
  readonly found: string | null;
}
/** The database needs `hot-updater db migrate`, or a new database; the handler answers 503. */
declare class HotUpdaterSchemaMigrationRequiredError extends Error {
  readonly adapterName: string;
  readonly currentVersion: string | undefined;
  readonly setting?: SchemaSettingMismatch | undefined;
  /** Every setting the fence found missing or different; `setting` is the first. */
  readonly settings: readonly SchemaSettingMismatch[];
  /**
   * The ids of the plugins whose `schema.<id>` setting is among them: the
   * plugins whose tables a migration has yet to create or change.
   */
  readonly plugins: readonly string[];
  constructor(adapterName: string, currentVersion: string | undefined, setting?: SchemaSettingMismatch | undefined, options?: ErrorOptions & {
    /** Every mismatch, when the fence found more than `setting`. */
    readonly settings?: readonly SchemaSettingMismatch[];
    /** How to create the plugins' tables on this database. */
    readonly fix?: string;
  });
}
/**
 * Settings keys and the values a process expects, `schema.engine` included:
 * a `ToolingTarget`'s settings.
 */
type SchemaSettings = Readonly<Record<string, string>>;
//#endregion
export { HotUpdaterSchemaMigrationRequiredError, SETTINGS_TABLE, SchemaSettingMismatch, SchemaSettings };