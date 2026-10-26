import { DatabaseAdapter } from "../../database/adapter.cjs";
import { SchemaSettings } from "../database/fence.cjs";
//#region src/engine/db/schemaSettings.d.ts
/** Writes the settings rows after every table exists. */
declare const writeSchemaSettings: (adapter: DatabaseAdapter, adapterName: string, settings: SchemaSettings) => Promise<void>;
//#endregion
export { writeSchemaSettings };