const require_schema = require("./schema.cjs");
//#region src/server/overview.ts
const encodeIdentity = (identity) => [
	identity.scopeKind,
	identity.releaseKind,
	identity.releaseId,
	identity.channel,
	identity.platform,
	identity.appVersionKind,
	identity.appVersion,
	identity.periodKind,
	String(identity.bucketStartMs)
].map((value) => `${new TextEncoder().encode(value).length}:${value}`).join("");
const fnv = (value, seed) => {
	let result = seed;
	for (const byte of new TextEncoder().encode(value)) {
		result ^= BigInt(byte);
		result = BigInt.asUintN(64, result * 1099511628211n);
	}
	return result.toString(16).padStart(16, "0");
};
/** A 128-bit hex key for a string: two FNV-1a 64 hashes with different seeds. */
const insightsKey = (value) => `${fnv(value, 14695981039346656037n)}${fnv(value, 9521211207457086692n)}`;
const insightsOverviewId = (identity) => insightsKey(encodeIdentity(identity));
const hour = (value) => Math.floor(value / 36e5) * 36e5;
const insightsOverviewDeltas = (event) => {
	const bucketStartMs = hour(event.received_at_ms);
	const counters = /* @__PURE__ */ new Map();
	const append = (identity, values) => {
		const key = encodeIdentity(identity);
		const previous = counters.get(key);
		counters.set(key, {
			identity,
			downloads: (previous?.downloads ?? 0) + values.downloads,
			applies: (previous?.applies ?? 0) + values.applies,
			failedLaunches: (previous?.failedLaunches ?? 0) + values.failedLaunches,
			activityIdentity: previous?.activityIdentity ?? values.activityIdentity
		});
	};
	const metric = (releaseId, values) => {
		const windowed = {
			...values,
			applies: 0
		};
		if (releaseId !== null) for (const [periodKind, start] of [["lifetime", 0], ["hour", bucketStartMs]]) append({
			scopeKind: "release",
			releaseKind: "specific",
			releaseId,
			channel: event.channel,
			platform: event.platform,
			appVersionKind: "all",
			appVersion: "",
			periodKind,
			bucketStartMs: start
		}, periodKind === "lifetime" ? values : windowed);
		append({
			scopeKind: "channel",
			releaseKind: "all",
			releaseId: "",
			channel: event.channel,
			platform: event.platform,
			appVersionKind: "all",
			appVersion: "",
			periodKind: "hour",
			bucketStartMs
		}, windowed);
	};
	const implied = event.metadata.implied_download === true ? 1 : 0;
	if (!require_schema.isLateEvent(event) && event.type === "UPDATE_DOWNLOADED") metric(event.to_release_id, {
		downloads: 1,
		applies: 0,
		failedLaunches: 0
	});
	else if (!require_schema.isLateEvent(event) && require_schema.isLaunch(event)) metric(event.to_release_id, {
		downloads: implied,
		applies: 1,
		failedLaunches: 0
	});
	else if (!require_schema.isLateEvent(event) && event.type === "RECOVERED") metric(event.from_release_id, {
		downloads: implied,
		applies: 0,
		failedLaunches: 1
	});
	for (const platform of [event.platform, "all"]) for (const appVersionKind of ["specific", "all"]) append({
		scopeKind: "usage",
		releaseKind: "all",
		releaseId: "",
		channel: event.channel,
		platform,
		appVersionKind,
		appVersion: appVersionKind === "specific" ? event.app_version : "",
		periodKind: "hour",
		bucketStartMs
	}, {
		downloads: 0,
		applies: 0,
		failedLaunches: 0,
		activityIdentity: event.install_id
	});
	return [...counters.values()];
};
//#endregion
exports.insightsKey = insightsKey;
exports.insightsOverviewDeltas = insightsOverviewDeltas;
exports.insightsOverviewId = insightsOverviewId;
