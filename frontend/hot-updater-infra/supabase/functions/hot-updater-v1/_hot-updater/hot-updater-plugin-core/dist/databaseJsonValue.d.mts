import { DatabaseBundleMetadata, DatabaseJsonObject } from "./types/databaseRows.mjs";
import "./types/index.mjs";
//#region src/databaseJsonValue.d.ts
/**
 * Whether `value` is a plain object of JSON values a store keeps as they
 * are: no cycles, accessors, non-finite numbers, or class instances. A
 * plugin checks a `json` field's value with it before it writes, as
 * Insights does for an event's metadata.
 */
declare const isDatabaseJsonObject: (value: unknown) => value is DatabaseJsonObject;
declare const isDatabaseMetadataObject: (value: unknown) => value is DatabaseBundleMetadata;
//#endregion
export { isDatabaseJsonObject, isDatabaseMetadataObject };