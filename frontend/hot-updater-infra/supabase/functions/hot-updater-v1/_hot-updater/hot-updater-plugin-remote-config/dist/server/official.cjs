//#region src/server/official.ts
/**
* The brand of Hot Updater's own plugins, a registered symbol that
* `@hot-updater/server` reads to reserve the id "remoteConfig" for this plugin.
* Each official plugin package keeps this copy, so none imports another's
* internals for it.
*/
const OFFICIAL = Symbol.for("@hot-updater/server/official-plugin");
/** Marks a plugin one of Hot Updater's own factories made. */
const markOfficial = (plugin) => Object.defineProperty(plugin, OFFICIAL, { value: true });
//#endregion
exports.markOfficial = markOfficial;
