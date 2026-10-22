import { ownEntry } from "../shared/ownEntry.mjs";
import { parseRemoteConfigFetchResponse, remoteConfigRequestPath } from "../shared/wire.mjs";
import { defineClientPlugin } from "@hot-updater/protocol";
//#region src/client/index.ts
const DEFAULT_MINIMUM_FETCH_INTERVAL_MS = 432e5;
const BOOLEAN_TRUTHY_VALUES = /* @__PURE__ */ new Set([
	"1",
	"true",
	"t",
	"yes",
	"y",
	"on"
]);
const FETCHED_KEY = "fetched";
const ACTIVE_KEY = "active";
const LAST_FETCH_STATUS_KEY = "lastFetchStatus";
const createValue = (text, source) => Object.freeze({
	asString: () => text,
	asNumber: () => {
		const number = Number(text);
		return Number.isNaN(number) ? 0 : number;
	},
	asBoolean: () => BOOLEAN_TRUTHY_VALUES.has(text.toLowerCase()),
	getSource: () => source
});
const parseStored = (text, extra) => {
	if (text === null) return null;
	try {
		const value = JSON.parse(text);
		if (typeof value !== "object" || value === null) return null;
		const record = value;
		if (parseRemoteConfigFetchResponse(record) === null || record.etag !== null && typeof record.etag !== "string" || !extra(record)) return null;
		return record;
	} catch {
		return null;
	}
};
const isFetchStatus = (value) => value === "success" || value === "failure";
const deviceContext = (context) => ({
	platform: context.platform,
	appVersion: context.appVersion,
	channel: context.getChannel(),
	cohort: context.getCohort(),
	fingerprintHash: context.getFingerprintHash()
});
/**
* Remote Config for the app: in-app defaults, values a server running the
* `remoteConfig()` plugin picks for this device, and a fetch and activate
* step between them. Add it to `HotUpdater.init`'s `plugins`, and read it
* from the instance `init` returns, as `hotUpdater.remoteConfig`. It fetches
* from the `baseURL`, request headers, and timeout configured there.
*
* @example
* ```ts
* import { HotUpdater, remoteConfig } from "@hot-updater/react-native";
*
* export const hotUpdater = HotUpdater.init({
*   baseURL,
*   plugins: [
*     remoteConfig({ defaults: { welcome_message: "Welcome", max_items: 20 } }),
*   ],
* });
*
* hotUpdater.remoteConfig.fetchAndActivate().catch(() => {});
* hotUpdater.remoteConfig.getString("welcome_message");
* ```
*/
const remoteConfig = (options = {}) => {
	const minimumFetchIntervalMs = options.minimumFetchIntervalMs ?? DEFAULT_MINIMUM_FETCH_INTERVAL_MS;
	if (typeof minimumFetchIntervalMs !== "number" || !Number.isFinite(minimumFetchIntervalMs) || minimumFetchIntervalMs < 0) throw new TypeError("[HotUpdater] remoteConfig({ minimumFetchIntervalMs }) must be a non-negative number.");
	const defaults = Object.fromEntries(Object.entries(options.defaults ?? {}).map(([key, value]) => [key, String(value)]));
	return defineClientPlugin({
		id: "remoteConfig",
		setup: (context) => ({ api: createRemoteConfigClient(context, {
			defaults,
			minimumFetchIntervalMs
		}) })
	});
};
/** The client a plugin's `setup` creates, over the values stored on the device. */
const createRemoteConfigClient = (context, { defaults, minimumFetchIntervalMs }) => {
	let active = parseStored(context.storage.get(ACTIVE_KEY), () => true);
	let fetched = parseStored(context.storage.get(FETCHED_KEY), (record) => typeof record.context === "string" && typeof record.fetchedAtMs === "number");
	const storedStatus = context.storage.get(LAST_FETCH_STATUS_KEY);
	let lastFetchStatus = isFetchStatus(storedStatus) ? storedStatus : fetched === null ? "no-fetch-yet" : "success";
	let inFlight = null;
	let snapshot = null;
	const listeners = /* @__PURE__ */ new Set();
	const notify = () => {
		snapshot = null;
		for (const listener of listeners) try {
			listener();
		} catch (error) {
			console.warn("[HotUpdater] A remoteConfig listener threw.", error);
		}
	};
	const store = (key, value) => {
		try {
			context.storage.set(key, value);
		} catch (error) {
			console.warn(`[HotUpdater] remoteConfig could not store its ${key} values.`, error);
		}
	};
	const setStatus = (status) => {
		lastFetchStatus = status;
		store(LAST_FETCH_STATUS_KEY, status);
	};
	const getValue = (key) => {
		const remote = ownEntry(active?.values, key);
		if (remote !== void 0) return createValue(remote, "remote");
		const fallback = ownEntry(defaults, key);
		return fallback === void 0 ? null : createValue(fallback, "default");
	};
	const fetchFromServer = async (device) => {
		const contextKey = JSON.stringify(device);
		let response;
		try {
			response = await context.fetch(remoteConfigRequestPath(device), { headers: fetched === null || fetched.etag === null ? {} : { "if-none-match": fetched.etag } });
		} catch (error) {
			setStatus("failure");
			throw new Error("[HotUpdater] Remote Config could not be fetched.", { cause: error });
		}
		const fetchedAtMs = context.now();
		if (response.status === 304 && fetched !== null) {
			fetched = {
				...fetched,
				context: contextKey,
				fetchedAtMs
			};
			store(FETCHED_KEY, JSON.stringify(fetched));
			setStatus("success");
			return;
		}
		if (!response.ok) {
			setStatus("failure");
			throw new Error(response.status === 404 ? "[HotUpdater] The server answered 404 to GET /remote-config: it runs without the remoteConfig() plugin." : `[HotUpdater] Remote Config fetch failed with HTTP ${response.status}.`);
		}
		const body = parseRemoteConfigFetchResponse(await response.json().catch(() => null));
		if (body === null) {
			setStatus("failure");
			throw new Error("[HotUpdater] The server's GET /remote-config answer is not Remote Config values.");
		}
		fetched = {
			version: body.version,
			values: body.values,
			etag: response.headers.get("etag"),
			context: contextKey,
			fetchedAtMs
		};
		store(FETCHED_KEY, JSON.stringify(fetched));
		setStatus("success");
	};
	const fetchValues = (options) => {
		const device = deviceContext(context);
		if (options?.force !== true && inFlight === null && fetched !== null && fetched.context === JSON.stringify(device) && context.now() - fetched.fetchedAtMs < minimumFetchIntervalMs) return Promise.resolve();
		inFlight ??= fetchFromServer(device).finally(() => {
			inFlight = null;
		});
		return inFlight;
	};
	const activate = async () => {
		if (fetched === null) return false;
		const next = {
			version: fetched.version,
			values: fetched.values,
			etag: fetched.etag
		};
		if (active !== null && active.version === next.version && JSON.stringify(active.values) === JSON.stringify(next.values)) return false;
		active = next;
		store(ACTIVE_KEY, JSON.stringify(active));
		notify();
		return true;
	};
	return Object.freeze({
		getValue,
		getString: (key) => getValue(key)?.asString() ?? null,
		getNumber: (key) => getValue(key)?.asNumber() ?? null,
		getBoolean: (key) => getValue(key)?.asBoolean() ?? null,
		getAll: () => {
			snapshot ??= Object.freeze(Object.fromEntries([.../* @__PURE__ */ new Set([...Object.keys(defaults), ...Object.keys(active?.values ?? {})])].map((key) => [key, getValue(key)])));
			return snapshot;
		},
		fetch: (options) => fetchValues(options),
		activate,
		fetchAndActivate: async (options) => {
			await fetchValues(options);
			return activate();
		},
		get lastFetchStatus() {
			return lastFetchStatus;
		},
		get fetchedAtMs() {
			return fetched?.fetchedAtMs ?? null;
		},
		get activeVersion() {
			return active?.version ?? 0;
		},
		subscribe: (listener) => {
			listeners.add(listener);
			return () => {
				listeners.delete(listener);
			};
		}
	});
};
//#endregion
export { remoteConfig };
