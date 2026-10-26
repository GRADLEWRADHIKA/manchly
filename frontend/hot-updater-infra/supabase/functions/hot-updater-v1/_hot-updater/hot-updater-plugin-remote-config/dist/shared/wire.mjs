//#region src/shared/wire.ts
/**
* The exchange between the app's `remoteConfig()` client plugin and the
* `remoteConfig()` server plugin: `GET /remote-config`, relative to the
* `baseURL` the app passes to `HotUpdater.init`. The app
* sends what conditions read as query parameters, and the server answers the
* values the published template gives them. Both sides import this module,
* which imports nothing, so the app's bundle never reaches server code.
*/
/** The path both sides use, relative to the app's `baseURL`. */
const REMOTE_CONFIG_PATH = "remote-config";
/** The query parameter each context field travels in. */
const REMOTE_CONFIG_QUERY = {
	platform: "platform",
	appVersion: "appVersion",
	channel: "channel",
	cohort: "cohort",
	fingerprintHash: "fingerprintHash"
};
/**
* `GET /remote-config?…`, with a field left out when it is null. It encodes
* the query itself, since React Native's `URLSearchParams` throws on `set`.
*/
const remoteConfigRequestPath = (context) => {
	const query = Object.keys(REMOTE_CONFIG_QUERY).flatMap((field) => {
		const value = context[field];
		return value === null ? [] : [`${encodeURIComponent(REMOTE_CONFIG_QUERY[field])}=${encodeURIComponent(value)}`];
	});
	return `${REMOTE_CONFIG_PATH}?${query.join("&")}`;
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/** A `200` body, checked; null when it is not one. */
const parseRemoteConfigFetchResponse = (value) => {
	if (!isRecord(value)) return null;
	const { version, values } = value;
	if (typeof version !== "number" || !Number.isSafeInteger(version) || version < 0 || !isRecord(values)) return null;
	const entries = Object.entries(values);
	if (entries.some(([, text]) => typeof text !== "string")) return null;
	return {
		version,
		values: Object.fromEntries(entries)
	};
};
//#endregion
export { REMOTE_CONFIG_PATH, REMOTE_CONFIG_QUERY, parseRemoteConfigFetchResponse, remoteConfigRequestPath };
