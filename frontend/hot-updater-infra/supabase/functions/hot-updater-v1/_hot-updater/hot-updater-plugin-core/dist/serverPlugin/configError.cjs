//#region src/serverPlugin/configError.ts
/** A misconfigured `createHotUpdater` call, reported at startup. */
var HotUpdaterConfigError = class extends Error {
	name = "HotUpdaterConfigError";
};
//#endregion
exports.HotUpdaterConfigError = HotUpdaterConfigError;
