import { DatabaseAdapter } from "../../database/adapter.mjs";
import { SchemaSettings } from "../database/fence.mjs";
//#region src/engine/db/schemaSettings.d.ts
/** Writes the settings rows after every table exists. */
declare const writeSchemaSettings: (adapter: DatabaseAdapter, adapterName: string, settings: SchemaSettings) => Promise<void>;
//#endregion
export { writeSchemaSettings };