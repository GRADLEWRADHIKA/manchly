const require_range_DvX_Y6iv = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/range-DvX-Y6iv.cjs");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/baseCandidateKey.ts
/**
* A new bundle's base-candidate key, which `findBaseBundleIds` on core's API
* and on a plugin's `ctx.core` takes: the Release Catalog scope its devices
* update from, and for an app version its normalized range; null for a
* target without a valid range. The CLI's deploy produces it this way.
*/
const targetBaseCandidateKey = (target) => {
	const channelKey = (0, _hot_updater_protocol.encodeChannelKey)(target.channel);
	if (target.fingerprintHash) return JSON.stringify([(0, _hot_updater_protocol.createReleaseCatalogScopeKey)({
		channelKey,
		fingerprintHash: target.fingerprintHash,
		platform: target.platform,
		strategy: "FINGERPRINT"
	})]);
	const range = target.appVersion === null ? null : require_range_DvX_Y6iv.l(target.appVersion);
	return range === null ? null : JSON.stringify([(0, _hot_updater_protocol.createReleaseCatalogScopeKey)({
		channelKey,
		platform: target.platform,
		strategy: "APP_VERSION"
	}), range]);
};
/**
* The scope and range a base-candidate key names, null for any other
* string: what an implementation of `findBaseBundleIds` reads the key with.
*/
const parseBaseCandidateKey = (key) => {
	try {
		const parsed = JSON.parse(key);
		if (!Array.isArray(parsed) || typeof parsed[0] !== "string") return null;
		const [scopeKey, text] = parsed;
		const { strategy } = (0, _hot_updater_protocol.parseReleaseCatalogScopeKey)(scopeKey);
		if (strategy === "FINGERPRINT") return parsed.length === 1 ? {
			scopeKey,
			range: null
		} : null;
		const range = parsed.length === 2 && typeof text === "string" ? require_range_DvX_Y6iv.l(text) : null;
		return range === null ? null : {
			scopeKey,
			range
		};
	} catch {
		return null;
	}
};
//#endregion
exports.parseBaseCandidateKey = parseBaseCandidateKey;
exports.targetBaseCandidateKey = targetBaseCandidateKey;
