import { Page } from "../../serverPlugin/databaseHandle.mjs";
import { DatabaseQueryError } from "../../serverPlugin/errors.mjs";
//#region src/engine/database/engineReads.d.ts
/** Reads and the rows (logical rows for aggregates) the engine returned to its callers. */
interface EngineReadCount {
  readonly calls: number;
  readonly rows: number;
}
//#endregion
export { EngineReadCount };