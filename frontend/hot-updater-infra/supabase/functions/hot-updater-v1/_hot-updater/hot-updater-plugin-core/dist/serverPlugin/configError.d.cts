//#region src/serverPlugin/configError.d.ts
/** A misconfigured `createHotUpdater` call, reported at startup. */
declare class HotUpdaterConfigError extends Error {
  readonly name = "HotUpdaterConfigError";
}
//#endregion
export { HotUpdaterConfigError };