let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/db/releaseCatalog.ts
/** A stored catalog payload, checked against its strategy's shape. */
const parseCompiledCatalog = (payload, strategy) => {
	const parsed = JSON.parse(payload);
	if (typeof parsed !== "object" || parsed === null || Reflect.get(parsed, "schemaVersion") !== _hot_updater_protocol.RELEASE_CATALOG_SCHEMA_VERSION || Reflect.get(parsed, "strategy") !== strategy || Reflect.get(parsed, "fallbackPolicy") !== _hot_updater_protocol.RELEASE_CATALOG_FALLBACK_POLICY || !Array.isArray(Reflect.get(parsed, "releaseDescriptors"))) throw new Error("Stored Release catalog payload is invalid");
	if (strategy === "APP_VERSION" && !Array.isArray(Reflect.get(parsed, "segments"))) throw new Error("Stored app-version Release catalog is invalid");
	if (strategy === "FINGERPRINT" && !Array.isArray(Reflect.get(parsed, "releaseIndexes"))) throw new Error("Stored fingerprint Release catalog is invalid");
	return parsed;
};
/** The scope key an update check reads. */
const releaseCatalogScopeKeyOf = (input) => input.strategy === "APP_VERSION" ? (0, _hot_updater_protocol.createReleaseCatalogScopeKey)({
	channelKey: input.channelKey,
	platform: input.platform,
	strategy: "APP_VERSION"
}) : (0, _hot_updater_protocol.createReleaseCatalogScopeKey)({
	channelKey: input.channelKey,
	fingerprintHash: input.fingerprintHash,
	platform: input.platform,
	strategy: "FINGERPRINT"
});
/** Projects a stored catalog row for one update check; null when the row is not this scope's. */
const projectReleaseCatalogRow = (row, input, scopeKey = releaseCatalogScopeKeyOf(input)) => {
	if (row === null || row.platform !== input.platform || row.strategy !== input.strategy || row.channel_key !== input.channelKey || row.scope_key !== scopeKey || row.fingerprint_hash !== (input.strategy === "FINGERPRINT" ? input.fingerprintHash : null)) return null;
	const compiled = parseCompiledCatalog(row.payload, input.strategy);
	const appVersion = input.strategy === "APP_VERSION" ? input.appVersion : void 0;
	return {
		catalogId: row.catalog_id,
		catalogHash: row.catalog_hash,
		fallbackPolicy: _hot_updater_protocol.RELEASE_CATALOG_FALLBACK_POLICY,
		generation: row.generation,
		releases: (0, _hot_updater_plugin_core.projectCompiledCatalog)(compiled, appVersion),
		rollbackReleases: (0, _hot_updater_plugin_core.projectCompiledRollbackCatalog)(compiled, appVersion),
		schemaVersion: _hot_updater_protocol.RELEASE_CATALOG_SCHEMA_VERSION,
		scopeKey
	};
};
//#endregion
exports.parseCompiledCatalog = parseCompiledCatalog;
exports.projectReleaseCatalogRow = projectReleaseCatalogRow;
exports.releaseCatalogScopeKeyOf = releaseCatalogScopeKeyOf;
