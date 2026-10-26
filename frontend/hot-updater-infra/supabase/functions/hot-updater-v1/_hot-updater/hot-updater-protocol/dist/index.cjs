Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
//#region ../../node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/comparison-DenM3wCn.js
const LETTER_DASH_NUMBER = "[a-zA-Z0-9-]";
const NUMERIC_IDENTIFIER = String.raw`0|[1-9]\d*`;
const NUMERIC_IDENTIFIER_LOOSE = String.raw`\d+`;
const NON_NUMERIC_IDENTIFIER = String.raw`\d*[a-zA-Z-]${LETTER_DASH_NUMBER}*`;
const MAIN_VERSION = String.raw`(${NUMERIC_IDENTIFIER})\.(${NUMERIC_IDENTIFIER})\.(${NUMERIC_IDENTIFIER})`;
const MAIN_VERSION_LOOSE = String.raw`(${NUMERIC_IDENTIFIER_LOOSE})\.(${NUMERIC_IDENTIFIER_LOOSE})\.(${NUMERIC_IDENTIFIER_LOOSE})`;
const PRERELEASE_IDENTIFIER = `(?:${NON_NUMERIC_IDENTIFIER}|${NUMERIC_IDENTIFIER})`;
const PRERELEASE_IDENTIFIER_LOOSE = `(?:${NON_NUMERIC_IDENTIFIER}|${NUMERIC_IDENTIFIER_LOOSE})`;
const PRERELEASE = String.raw`(?:-(${PRERELEASE_IDENTIFIER}(?:\.${PRERELEASE_IDENTIFIER})*))`;
const PRERELEASE_LOOSE = String.raw`(?:-?(${PRERELEASE_IDENTIFIER_LOOSE}(?:\.${PRERELEASE_IDENTIFIER_LOOSE})*))`;
const BUILD_IDENTIFIER = `${LETTER_DASH_NUMBER}+`;
const BUILD = String.raw`(?:\+(${BUILD_IDENTIFIER}(?:\.${BUILD_IDENTIFIER})*))`;
const FULL_PLAIN = `v?${MAIN_VERSION}${PRERELEASE}?${BUILD}?`;
const LOOSE_PLAIN = String.raw`[v=\s]*${MAIN_VERSION_LOOSE}${PRERELEASE_LOOSE}?${BUILD}?`;
const XRANGE_IDENTIFIER = String.raw`${NUMERIC_IDENTIFIER}|x|X|\*`;
const XRANGE_IDENTIFIER_LOOSE = String.raw`${NUMERIC_IDENTIFIER_LOOSE}|x|X|\*`;
String.raw`[v=\s]*(${XRANGE_IDENTIFIER})(?:\.(${XRANGE_IDENTIFIER})(?:\.(${XRANGE_IDENTIFIER})(?:${PRERELEASE})?${BUILD}?)?)?`;
String.raw`[v=\s]*(${XRANGE_IDENTIFIER_LOOSE})(?:\.(${XRANGE_IDENTIFIER_LOOSE})(?:\.(${XRANGE_IDENTIFIER_LOOSE})(?:${PRERELEASE_LOOSE})?${BUILD}?)?)?`;
String.raw`(?:\^)`;
const COERCE_PLAIN = String.raw`(^|[^\d])(\d{1,${16}})(?:\.(\d{1,${16}}))?(?:\.(\d{1,${16}}))?`;
const COERCE = String.raw`${COERCE_PLAIN}(?:$|[^\d])`;
const COERCE_FULL = String.raw`${COERCE_PLAIN}(?:${PRERELEASE})?(?:${BUILD})?(?:$|[^\d])`;
function makeSafeRegexSource(source) {
	const replacements = [
		[String.raw`\s`, 1],
		[String.raw`\d`, 256],
		[LETTER_DASH_NUMBER, 250]
	];
	for (const [token, maximum] of replacements) source = source.split(`${token}*`).join(`${token}{0,${maximum}}`).split(`${token}+`).join(`${token}{1,${maximum}}`);
	return source;
}
function safeRegex(source, flags) {
	return new RegExp(makeSafeRegexSource(source), flags);
}
const FULL = safeRegex(`^${FULL_PLAIN}$`);
const LOOSE = safeRegex(`^${LOOSE_PLAIN}$`);
const NUMERIC$1 = /^\d+$/;
function formatComparableVersion(version) {
	const base = `${version.major}.${version.minor}.${version.patch}`;
	return version.prerelease?.length ? `${base}-${version.prerelease.join(".")}` : base;
}
function formatFullVersion(version) {
	const comparable = formatComparableVersion(version);
	return version.build?.length ? `${comparable}+${version.build.join(".")}` : comparable;
}
function parse(version, options = {}) {
	if (typeof version !== "string") return version;
	if (version.length > 256) throw new TypeError(`Version exceeds the maximum length of 256 characters`);
	const match = version.trim().match(options.loose ? LOOSE : FULL);
	if (!match) throw new TypeError(`Invalid version syntax: ${version}`);
	const major = Number(match[1]);
	const minor = Number(match[2]);
	const patch = Number(match[3]);
	if (major > Number.MAX_SAFE_INTEGER || major < 0) throw new TypeError(`Invalid major version: ${match[1]}`);
	if (minor > Number.MAX_SAFE_INTEGER || minor < 0) throw new TypeError(`Invalid minor version: ${match[2]}`);
	if (patch > Number.MAX_SAFE_INTEGER || patch < 0) throw new TypeError(`Invalid patch version: ${match[3]}`);
	const prerelease = match[4] ? match[4].split(".").map((identifier) => {
		if (NUMERIC$1.test(identifier)) {
			const numeric = Number(identifier);
			if (numeric >= 0 && numeric < Number.MAX_SAFE_INTEGER) return numeric;
		}
		return identifier;
	}) : void 0;
	return {
		build: match[5]?.split("."),
		major,
		minor,
		patch,
		prerelease
	};
}
function tryParse(version, options = {}) {
	try {
		return parse(version, options);
	} catch {
		return null;
	}
}
//#endregion
//#region ../../node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/version-CQ98ZBpL.js
const COERCE_EXACT = safeRegex(COERCE);
const COERCE_FULL_EXACT = safeRegex(COERCE_FULL);
safeRegex(`^${PRERELEASE}$`);
safeRegex(`^${PRERELEASE_LOOSE}$`);
function normalizeFull(version, options = {}) {
	const parsed = tryParse(version, options);
	return parsed ? formatFullVersion(parsed) : null;
}
function coerce(value, options = {}) {
	if (typeof value === "object") return value;
	const input = typeof value === "number" ? String(value) : value;
	let match = null;
	if (options.rtl) {
		const expression = safeRegex(options.includePrerelease ? COERCE_FULL : COERCE, "g");
		let next;
		while ((next = expression.exec(input)) && (!match || match.index + match[0].length !== input.length)) {
			if (!match || next.index + next[0].length !== match.index + match[0].length) match = next;
			expression.lastIndex = next.index + next[1].length + next[2].length;
		}
	} else match = (options.includePrerelease ? COERCE_FULL_EXACT : COERCE_EXACT).exec(input);
	if (!match) return null;
	const major = match[2];
	return tryParse(`${major}.${match[3] || "0"}.${match[4] || "0"}${options.includePrerelease && match[5] ? `-${match[5]}` : ""}${options.includePrerelease && match[6] ? `+${match[6]}` : ""}`, options);
}
//#endregion
//#region src/appVersion.ts
/**
* The form of an app version that the device and the server compare:
* `major.minor.patch` of the first version in `appVersion`, such as `1.4.0`
* for `v1.4`, or null when it holds none. Prerelease and build parts are
* dropped.
*/
function canonicalizeAppVersion(appVersion) {
	const version = coerce(appVersion);
	return version ? normalizeFull(version) : null;
}
//#endregion
//#region src/baseURL.ts
/** Resolves a functional baseURL and drops trailing slashes. */
const resolveBaseURL = async (baseURL) => {
	const resolvedBaseURL = typeof baseURL === "function" ? await baseURL() : baseURL;
	if (!resolvedBaseURL) throw new Error("baseURL function must return a non-empty string");
	return resolvedBaseURL.replace(/\/+$/, "");
};
//#endregion
//#region src/bundleArtifacts.ts
const getManifestStorageUri = (bundle) => bundle.manifestStorageUri;
const getManifestFileHash = (bundle) => bundle.manifestFileHash;
const getAssetBaseStorageUri = (bundle) => bundle.assetBaseStorageUri;
const isBundlePatchArtifact = (value) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const candidate = value;
	return typeof candidate.baseBundleId === "string" && typeof candidate.baseFileHash === "string" && typeof candidate.patchFileHash === "string" && typeof candidate.patchStorageUri === "string";
};
const readBundlePatchArray = (patches) => {
	if (!Array.isArray(patches)) return [];
	return patches.filter(isBundlePatchArtifact);
};
const getBundlePatches = (bundle) => {
	const patches = readBundlePatchArray(bundle.patches);
	const seenBaseBundleIds = /* @__PURE__ */ new Set();
	return patches.filter((patch) => {
		if (seenBaseBundleIds.has(patch.baseBundleId)) return false;
		seenBaseBundleIds.add(patch.baseBundleId);
		return true;
	});
};
const getBundlePatch = (bundle, baseBundleId) => {
	return getBundlePatches(bundle).find((patch) => patch.baseBundleId === baseBundleId) ?? null;
};
const getPrimaryPatch = (bundle) => {
	return getBundlePatches(bundle)[0] ?? null;
};
const getPatchBaseBundleId = (bundle) => getPrimaryPatch(bundle)?.baseBundleId ?? null;
const getPatchBaseFileHash = (bundle) => getPrimaryPatch(bundle)?.baseFileHash ?? null;
const getPatchFileHash = (bundle) => getPrimaryPatch(bundle)?.patchFileHash ?? null;
const getPatchStorageUri = (bundle) => getPrimaryPatch(bundle)?.patchStorageUri ?? null;
//#endregion
//#region src/clientPlugin.ts
/** Declares a client plugin; built-in and third-party plugins use the same contract. */
const defineClientPlugin = (plugin) => plugin;
//#endregion
//#region src/createPluginHost.ts
/** Storage values stay small, since native reads them on the JS thread. */
const MAX_STORAGE_VALUE_LENGTH = 65536;
/** Where a plugin's key lives in native storage. */
const pluginStorageKey = (pluginId, key) => `plugins/${encodeURIComponent(pluginId)}/${key}`;
const createPluginHost = (environment) => {
	let config = null;
	/** Hooks and API by plugin, so a plugin configured again is not set up twice. */
	const setUpPlugins = /* @__PURE__ */ new WeakMap();
	let activePlugins = [];
	/** What plugins read and wrote, so a read follows a write before native does. */
	const storageValues = /* @__PURE__ */ new Map();
	const reportHookError = (message, error) => {
		const report = new Error(`[HotUpdater] ${message}`, { cause: error });
		try {
			if (config?.onError) {
				config.onError(report);
				return;
			}
		} catch {}
		console.warn(report.message, error);
	};
	const fetchFromServer = async (path, init = {}) => {
		if (config === null) throw new Error("[HotUpdater] Plugins can fetch only after HotUpdater.init.");
		if (/^[a-z][a-z\d+.-]*:/i.test(path) || path.startsWith("//")) throw new TypeError("[HotUpdater] Plugin fetch takes a path relative to baseURL.");
		const { requestHeaders, requestTimeout } = config;
		const url = `${await resolveBaseURL(config.baseURL)}/${path.replace(/^\/+/, "")}`;
		const headers = new Headers(requestHeaders);
		new Headers(init.headers).forEach((value, name) => {
			headers.set(name, value);
		});
		const controller = new AbortController();
		const callerSignal = init.signal;
		const abortFromCaller = () => controller.abort();
		if (callerSignal?.aborted) controller.abort();
		callerSignal?.addEventListener("abort", abortFromCaller);
		let timedOut = false;
		const timeoutId = setTimeout(() => {
			timedOut = true;
			controller.abort();
		}, requestTimeout ?? 5e3);
		try {
			return await environment.fetch(url, {
				...init,
				headers,
				signal: controller.signal
			});
		} catch (error) {
			if (!callerSignal?.aborted && (timedOut || error instanceof Error && error.name === "AbortError")) throw new Error("Request timed out");
			throw error;
		} finally {
			clearTimeout(timeoutId);
			callerSignal?.removeEventListener("abort", abortFromCaller);
		}
	};
	const createStorage = (pluginId) => {
		const scopedKey = (key) => {
			if (typeof key !== "string" || key.length === 0) throw new TypeError("[HotUpdater] Plugin storage keys are non-empty strings.");
			return pluginStorageKey(pluginId, key);
		};
		return {
			get: (key) => {
				const storageKey = scopedKey(key);
				const cached = storageValues.get(storageKey);
				if (cached !== void 0) return cached;
				const value = environment.getStorageItem(storageKey);
				storageValues.set(storageKey, value);
				return value;
			},
			set: (key, value) => {
				const storageKey = scopedKey(key);
				if (value !== null && typeof value !== "string") throw new TypeError("[HotUpdater] Plugin storage values are strings or null.");
				if (value !== null && value.length > MAX_STORAGE_VALUE_LENGTH) throw new RangeError("[HotUpdater] Plugin storage values are at most 64 KB.");
				environment.setStorageItem(storageKey, value);
				storageValues.set(storageKey, value);
			}
		};
	};
	const createContext = (pluginId) => ({
		fetch: fetchFromServer,
		get installId() {
			return environment.getInstallId();
		},
		platform: environment.platform,
		get appVersion() {
			return environment.getAppVersion();
		},
		get sdkVersion() {
			return environment.sdkVersion;
		},
		get minBundleId() {
			return environment.getMinBundleId();
		},
		isDebugBuild: environment.isDebugBuild,
		getBundleId: () => environment.getBundleId(),
		getChannel: () => environment.getChannel(),
		getCohort: () => environment.getCohort(),
		getFingerprintHash: () => environment.getFingerprintHash(),
		storage: createStorage(pluginId),
		now: () => environment.now()
	});
	const setUpPlugin = (plugin) => {
		let result;
		try {
			result = plugin.setup(createContext(plugin.id));
		} catch (error) {
			reportHookError(`Plugin "${plugin.id}" failed in setup`, error);
			return {
				hooks: {},
				api: void 0
			};
		}
		if (result === void 0 || result === null) return {
			hooks: {},
			api: void 0
		};
		const unknownKeys = Object.keys(result).filter((key) => key !== "hooks" && key !== "api");
		if (unknownKeys.length > 0) reportHookError(`Plugin "${plugin.id}" setup returned ${unknownKeys.map((key) => `"${key}"`).join(", ")}; setup returns { hooks, api }`, /* @__PURE__ */ new TypeError("Unexpected setup result"));
		return {
			hooks: result.hooks ?? {},
			api: result.api
		};
	};
	const configurePlugins = (plugins, nextConfig) => {
		const ids = /* @__PURE__ */ new Set();
		for (const plugin of plugins ?? []) {
			if (typeof plugin.id !== "string" || plugin.id.length === 0) throw new Error("[HotUpdater] A plugin id must be a non-empty string.");
			if (ids.has(plugin.id)) throw new Error(`[HotUpdater] Two plugins use the id "${plugin.id}". Plugin ids must be unique.`);
			ids.add(plugin.id);
		}
		config = nextConfig;
		const apis = [];
		activePlugins = (plugins ?? []).map((plugin) => {
			let setUp = setUpPlugins.get(plugin);
			if (setUp === void 0) {
				setUp = setUpPlugin(plugin);
				setUpPlugins.set(plugin, setUp);
			}
			if (setUp.api !== void 0) apis.push([plugin.id, setUp.api]);
			return {
				plugin,
				hooks: setUp.hooks
			};
		});
		return Object.freeze(Object.fromEntries(apis));
	};
	const hasPluginHook = (name) => activePlugins.some(({ hooks }) => typeof hooks[name] === "function");
	const buildPluginEvent = (name, createPayload) => {
		if (!hasPluginHook(name)) return null;
		try {
			return createPayload();
		} catch (error) {
			reportHookError(`Failed to build the ${name} event for plugins`, error);
			return null;
		}
	};
	const dispatchPluginHook = (name, payload) => {
		const settlements = [];
		for (const { plugin, hooks } of activePlugins) {
			const hook = hooks[name];
			if (typeof hook !== "function") continue;
			try {
				const result = hook.call(hooks, payload);
				if (result !== null && typeof result === "object" && typeof result.then === "function") settlements.push(Promise.resolve(result).then(() => void 0, (error) => {
					reportHookError(`Plugin "${plugin.id}" failed in ${name}`, error);
				}));
			} catch (error) {
				reportHookError(`Plugin "${plugin.id}" failed in ${name}`, error);
			}
		}
		return settlements;
	};
	const emitPluginHook = (name, createPayload) => {
		const payload = buildPluginEvent(name, createPayload);
		if (payload !== null) dispatchPluginHook(name, payload);
	};
	return {
		configurePlugins,
		hasPluginHook,
		buildPluginEvent,
		dispatchPluginHook,
		emitPluginHook
	};
};
//#endregion
//#region src/rollout.ts
const NUMERIC_COHORT_SIZE = 1e3;
const DEFAULT_ROLLOUT_COHORT_COUNT = NUMERIC_COHORT_SIZE;
const MAX_COHORT_LENGTH = 64;
const INVALID_COHORT_ERROR_MESSAGE = `Invalid cohort. Use 1-1000 or a lowercase slug without spaces, up to 64 characters.`;
const CUSTOM_COHORT_PATTERN = /^[a-z0-9-]+$/;
function parseNumericCohortValue(cohort) {
	if (!/^\d+$/.test(cohort)) return null;
	const parsed = Number.parseInt(cohort, 10);
	if (Number.isNaN(parsed) || parsed < 1 || parsed > 1e3) return null;
	return parsed;
}
function positiveMod(value, modulus) {
	return (value % modulus + modulus) % modulus;
}
function hashString(value) {
	let hash = 0;
	for (let i = 0; i < value.length; i++) {
		const char = value.charCodeAt(i);
		hash = (hash << 5) - hash + char;
		hash |= 0;
	}
	return hash;
}
function gcd(a, b) {
	let x = Math.abs(a);
	let y = Math.abs(b);
	while (y !== 0) {
		const next = x % y;
		x = y;
		y = next;
	}
	return x;
}
function modularInverse(value, modulus) {
	let t = 0;
	let newT = 1;
	let r = modulus;
	let newR = positiveMod(value, modulus);
	while (newR !== 0) {
		const quotient = Math.floor(r / newR);
		[t, newT] = [newT, t - quotient * newT];
		[r, newR] = [newR, r - quotient * newR];
	}
	if (r > 1) throw new Error(`No modular inverse for ${value} mod ${modulus}`);
	return positiveMod(t, modulus);
}
function getRolloutShuffleParameters(bundleId) {
	let multiplier = positiveMod(hashString(`${bundleId}:multiplier`), 997);
	if (multiplier === 0) multiplier = 1;
	while (gcd(multiplier, NUMERIC_COHORT_SIZE) !== 1) {
		multiplier = positiveMod(multiplier + 1, NUMERIC_COHORT_SIZE);
		if (multiplier === 0) multiplier = 1;
	}
	const offset = positiveMod(hashString(`${bundleId}:offset`), NUMERIC_COHORT_SIZE);
	return {
		multiplier,
		offset,
		inverseMultiplier: modularInverse(multiplier, NUMERIC_COHORT_SIZE)
	};
}
function normalizeRolloutCohortCount(rolloutCohortCount) {
	if (rolloutCohortCount === null || rolloutCohortCount === void 0) return DEFAULT_ROLLOUT_COHORT_COUNT;
	if (rolloutCohortCount <= 0) return 0;
	if (rolloutCohortCount >= 1e3) return NUMERIC_COHORT_SIZE;
	return Math.floor(rolloutCohortCount);
}
function normalizeCohortValue(cohort) {
	const normalized = cohort.trim().toLowerCase();
	const numericCohort = parseNumericCohortValue(normalized);
	if (numericCohort !== null) return String(numericCohort);
	return normalized;
}
function getNumericCohortValue(cohort) {
	return parseNumericCohortValue(normalizeCohortValue(cohort));
}
function isNumericCohort(cohort) {
	return getNumericCohortValue(cohort) !== null;
}
function isCustomCohort(cohort) {
	const normalized = normalizeCohortValue(cohort);
	return normalized.length > 0 && normalized.length <= 64 && !/^\d+$/.test(normalized) && CUSTOM_COHORT_PATTERN.test(normalized);
}
function isValidCohort(cohort) {
	const normalized = normalizeCohortValue(cohort);
	return isNumericCohort(normalized) || isCustomCohort(normalized);
}
function getDefaultNumericCohort(identifier) {
	const cohortValue = positiveMod(hashString(identifier), NUMERIC_COHORT_SIZE) + 1;
	return String(cohortValue);
}
function getNumericCohortRolloutPosition(bundleId, cohortValue) {
	if (cohortValue < 1 || cohortValue > 1e3) throw new Error(`Invalid numeric cohort: ${cohortValue}`);
	const { offset, inverseMultiplier } = getRolloutShuffleParameters(bundleId);
	return positiveMod(inverseMultiplier * (cohortValue - 1 - offset), NUMERIC_COHORT_SIZE);
}
function getRolledOutNumericCohorts(bundleId, rolloutCohortCount) {
	const normalizedRolloutCount = normalizeRolloutCohortCount(rolloutCohortCount);
	if (normalizedRolloutCount <= 0) return [];
	if (normalizedRolloutCount >= 1e3) return Array.from({ length: NUMERIC_COHORT_SIZE }, (_, index) => index + 1);
	const { multiplier, offset } = getRolloutShuffleParameters(bundleId);
	return Array.from({ length: normalizedRolloutCount }, (_, position) => positiveMod(multiplier * position + offset, NUMERIC_COHORT_SIZE)).map((zeroBasedCohort) => zeroBasedCohort + 1).sort((left, right) => left - right);
}
function isCohortEligibleForUpdate(bundleId, cohort, rolloutCohortCount, targetCohorts) {
	const normalizedCohort = cohort === null || cohort === void 0 ? void 0 : normalizeCohortValue(cohort);
	const normalizedTargetCohorts = targetCohorts?.map((targetCohort) => normalizeCohortValue(targetCohort)) ?? [];
	if (normalizedCohort !== void 0 && normalizedTargetCohorts.includes(normalizedCohort)) return true;
	const normalizedRolloutCount = normalizeRolloutCohortCount(rolloutCohortCount);
	if (normalizedRolloutCount <= 0) return false;
	if (normalizedCohort === void 0) return normalizedRolloutCount >= NUMERIC_COHORT_SIZE;
	const numericCohort = getNumericCohortValue(normalizedCohort);
	if (numericCohort === null) return false;
	if (normalizedRolloutCount >= 1e3) return true;
	return getNumericCohortRolloutPosition(bundleId, numericCohort) < normalizedRolloutCount;
}
//#endregion
//#region src/releaseCatalog.ts
const RELEASE_CATALOG_SCHEMA_VERSION = 1;
const RELEASE_CATALOG_FALLBACK_POLICY = "BUILTIN_IF_ACTIVE_INELIGIBLE";
const MAX_CRASHED_BUNDLES = 10;
const MAX_TARGET_COHORTS_PER_RELEASE = 100;
const MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE = 512;
const MAX_COMPILED_CATALOG_BYTES = 262144;
const hashSelectionContext = (value) => {
	let first = 2166136261;
	let second = 2654435769;
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		first = Math.imul(first ^ code, 16777619);
		second = Math.imul(second ^ code, 2246822507);
	}
	return `v1:${(first >>> 0).toString(16).padStart(8, "0")}${(second >>> 0).toString(16).padStart(8, "0")}`;
};
function createReleaseSelectionContextHash(input) {
	const crashedBundleIds = [...new Set(input.crashedBundleIds)].sort().slice(0, 10);
	const canonical = JSON.stringify({
		activeBundleId: input.activeBundleId ?? null,
		activeReleaseId: input.activeReleaseId ?? null,
		cohort: normalizeCohortValue(input.cohort ?? ""),
		crashedBundleIds,
		minimumReleaseId: input.minimumReleaseId,
		selectorSchemaVersion: 1,
		strategy: input.strategy,
		strategyValue: input.strategyValue
	});
	return hashSelectionContext(canonical);
}
function isReleaseEligibleForCohort(release, cohort) {
	if (isCohortEligibleForUpdate(release.releaseId, cohort, release.rolloutCohortCount, release.targetCohorts)) return true;
	return cohort !== null && cohort !== void 0 && isCustomCohort(normalizeCohortValue(cohort)) && normalizeRolloutCohortCount(release.rolloutCohortCount) === 1e3;
}
function selectDesiredRelease(catalog, input) {
	const crashedBundleIds = new Set(input.crashedBundleIds);
	const activeReleaseId = input.activeReleaseId ?? null;
	const hasActiveBundle = input.currentBundleId !== input.builtInBundleId;
	const isSafeBundleRelease = (release) => release.bundleId !== null && !crashedBundleIds.has(release.bundleId) && release.bundleId >= input.minimumReleaseId;
	const runningReleaseId = input.runningReleaseId === void 0 ? activeReleaseId : input.runningReleaseId;
	const isNewerThanRunning = (release) => runningReleaseId !== null ? release.releaseId > runningReleaseId : release.bundleId !== null && release.bundleId > input.currentBundleId;
	const passesForcedRelease = (selected) => [selected, ...catalog.rollbackReleases].some((passed) => passed.shouldForceUpdate && passed.bundleId !== null && passed.bundleId >= input.minimumReleaseId && passed.bundleId !== input.currentBundleId && passed.releaseId <= selected.releaseId && isNewerThanRunning(passed) && isReleaseEligibleForCohort(passed, input.cohort));
	const desiredBundle = (release, status) => ({
		bundleId: release.bundleId,
		kind: "BUNDLE",
		release,
		releaseId: release.releaseId,
		shouldForceUpdate: status === "ROLLBACK" || passesForcedRelease(release),
		status
	});
	for (const release of catalog.releases) {
		if (!isReleaseEligibleForCohort(release, input.cohort)) continue;
		if (activeReleaseId !== null && release.releaseId <= activeReleaseId || activeReleaseId === null && hasActiveBundle && (release.bundleId === null || release.bundleId <= input.currentBundleId)) continue;
		if (isSafeBundleRelease(release)) return desiredBundle(release, "UPDATE");
	}
	if (activeReleaseId !== null || hasActiveBundle) {
		const { rollbackReleases } = catalog;
		const current = rollbackReleases.find((release) => release.releaseId === activeReleaseId || activeReleaseId === null && release.bundleId === input.currentBundleId);
		if (current !== void 0 && isSafeBundleRelease(current) && isReleaseEligibleForCohort(current, input.cohort)) return desiredBundle(current, "UPDATE");
		const rollback = rollbackReleases.find((release) => isSafeBundleRelease(release) && (activeReleaseId !== null ? release.releaseId < activeReleaseId : release.bundleId < input.currentBundleId));
		if (rollback !== void 0 && isSafeBundleRelease(rollback)) return desiredBundle(rollback, "ROLLBACK");
		if (input.currentBundleId <= input.minimumReleaseId) return null;
	}
	if (catalog.fallbackPolicy !== "BUILTIN_IF_ACTIVE_INELIGIBLE") return null;
	return {
		bundleId: input.builtInBundleId,
		kind: "BUILTIN",
		release: null,
		releaseId: null,
		shouldForceUpdate: true,
		status: "ROLLBACK"
	};
}
function assessCatalogAcceptance(incoming, highestSeen) {
	if (highestSeen === null) return {
		accepted: true,
		shouldAdvanceHighWater: true
	};
	if (incoming.generation < highestSeen.generation) return {
		accepted: false,
		reason: "STALE_GENERATION"
	};
	if (incoming.generation === highestSeen.generation && incoming.catalogHash !== highestSeen.catalogHash) return {
		accepted: false,
		reason: "GENERATION_HASH_MISMATCH"
	};
	return {
		accepted: true,
		shouldAdvanceHighWater: incoming.generation > highestSeen.generation
	};
}
function authorizeReleaseTransition(input) {
	const { active, desired, explicitScopeSwitch } = input;
	if (active === null || active.scopeKey === null || active.generation === null) return {
		authorized: true,
		reason: "FIRST_AUTHENTICATED_SELECTION"
	};
	if (desired.catalogId !== active.catalogId || desired.scopeKey !== active.scopeKey) {
		if (!explicitScopeSwitch) return {
			authorized: false,
			reason: "UNSOLICITED_SCOPE"
		};
		if (desired.releaseId === null || desired.kind === "BUILTIN") return {
			authorized: false,
			reason: "EMPTY_TARGET_SCOPE"
		};
		return {
			authorized: true,
			reason: "EXPLICIT_SCOPE_SWITCH"
		};
	}
	if (desired.generation === null || desired.generation < active.generation) return {
		authorized: false,
		reason: "STALE_GENERATION"
	};
	if (desired.generation > active.generation) return {
		authorized: true,
		reason: "NEWER_POLICY"
	};
	if (desired.selectionContextHash !== active.selectionContextHash) return {
		authorized: true,
		reason: "CONTEXT_RESELECTION"
	};
	return {
		authorized: false,
		reason: "BACKWARD_NOT_AUTHORIZED"
	};
}
//#endregion
//#region src/releaseCatalogScope.ts
const BASE64URL_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
const MAX_CATALOG_SEGMENT_LENGTH = 255;
function assertCatalogSegment(value, name) {
	if (value.length === 0 || value.length > MAX_CATALOG_SEGMENT_LENGTH || !/^[A-Za-z0-9._~-]+$/.test(value)) throw new Error(`${name} must be 1-${MAX_CATALOG_SEGMENT_LENGTH} URL-safe ASCII characters`);
}
function encodeUtf8(value) {
	const bytes = [];
	for (const codePointText of value) {
		const codePoint = codePointText.codePointAt(0);
		if (codePoint <= 127) bytes.push(codePoint);
		else if (codePoint <= 2047) bytes.push(192 | codePoint >> 6, 128 | codePoint & 63);
		else if (codePoint <= 65535) bytes.push(224 | codePoint >> 12, 128 | codePoint >> 6 & 63, 128 | codePoint & 63);
		else bytes.push(240 | codePoint >> 18, 128 | codePoint >> 12 & 63, 128 | codePoint >> 6 & 63, 128 | codePoint & 63);
	}
	return bytes;
}
function decodeUtf8(bytes) {
	let result = "";
	for (let index = 0; index < bytes.length;) {
		const first = bytes[index++];
		let codePoint;
		let continuationCount;
		if (first <= 127) {
			codePoint = first;
			continuationCount = 0;
		} else if ((first & 224) === 192) {
			codePoint = first & 31;
			continuationCount = 1;
		} else if ((first & 240) === 224) {
			codePoint = first & 15;
			continuationCount = 2;
		} else if ((first & 248) === 240) {
			codePoint = first & 7;
			continuationCount = 3;
		} else throw new Error("Invalid UTF-8 channel key");
		for (let offset = 0; offset < continuationCount; offset += 1) {
			const continuation = bytes[index++];
			if (continuation === void 0 || (continuation & 192) !== 128) throw new Error("Invalid UTF-8 channel key");
			codePoint = codePoint << 6 | continuation & 63;
		}
		if (codePoint > 1114111 || codePoint >= 55296 && codePoint <= 57343 || continuationCount === 1 && codePoint < 128 || continuationCount === 2 && codePoint < 2048 || continuationCount === 3 && codePoint < 65536) throw new Error("Invalid UTF-8 channel key");
		result += String.fromCodePoint(codePoint);
	}
	return result;
}
function base64UrlEncode(bytes) {
	let result = "";
	for (let index = 0; index < bytes.length; index += 3) {
		const first = bytes[index];
		const second = bytes[index + 1];
		const third = bytes[index + 2];
		const value = first << 16 | (second ?? 0) << 8 | (third ?? 0);
		result += BASE64URL_ALPHABET[value >> 18 & 63];
		result += BASE64URL_ALPHABET[value >> 12 & 63];
		if (second !== void 0) result += BASE64URL_ALPHABET[value >> 6 & 63];
		if (third !== void 0) result += BASE64URL_ALPHABET[value & 63];
	}
	return result;
}
function base64UrlDecode(value) {
	if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) throw new Error("Invalid channel key");
	const bytes = [];
	for (let index = 0; index < value.length; index += 4) {
		const chunk = value.slice(index, index + 4);
		const encoded = [...chunk].map((character) => BASE64URL_ALPHABET.indexOf(character));
		if (encoded.some((part) => part < 0)) throw new Error("Invalid channel key");
		const bits = encoded[0] << 18 | encoded[1] << 12 | (encoded[2] ?? 0) << 6 | (encoded[3] ?? 0);
		bytes.push(bits >> 16 & 255);
		if (chunk.length >= 3) bytes.push(bits >> 8 & 255);
		if (chunk.length === 4) bytes.push(bits & 255);
	}
	return bytes;
}
function normalizeChannelName(channel) {
	return channel.trim().normalize("NFC");
}
function assertCanonicalChannelName(channel) {
	const normalized = normalizeChannelName(channel);
	if (normalized.length === 0 || normalized !== channel) throw new Error("Channel name must be non-empty, trimmed, and NFC-normalized");
	let codePointCount = 0;
	for (const _codePoint of normalized) {
		codePointCount += 1;
		if (codePointCount > 255) throw new Error("Channel name must not exceed 255 characters");
	}
}
function encodeChannelKey(channel) {
	assertCanonicalChannelName(channel);
	return base64UrlEncode(encodeUtf8(channel));
}
function decodeChannelKey(channelKey) {
	const channel = decodeUtf8(base64UrlDecode(channelKey));
	assertCanonicalChannelName(channel);
	if (encodeChannelKey(channel) !== channelKey) throw new Error("Channel key is not canonically encoded");
	return channel;
}
function createReleaseCatalogScopeKey(input) {
	decodeChannelKey(input.channelKey);
	if (input.strategy === "APP_VERSION") return `v1:app-version:${input.platform}:${input.channelKey}`;
	assertCatalogSegment(input.fingerprintHash, "Fingerprint hash");
	return `v1:fingerprint:${input.platform}:${input.channelKey}:${input.fingerprintHash}`;
}
function parseReleaseCatalogScopeKey(scopeKey) {
	const segments = scopeKey.split(":");
	const [version, strategy, platform, channelKey] = segments;
	if (version !== "v1" || platform !== "ios" && platform !== "android" || channelKey === void 0) throw new Error("Invalid release catalog scope key");
	const input = strategy === "app-version" && segments.length === 4 ? {
		channelKey,
		platform,
		strategy: "APP_VERSION"
	} : strategy === "fingerprint" && segments.length === 5 && segments[4] !== void 0 ? {
		channelKey,
		fingerprintHash: segments[4],
		platform,
		strategy: "FINGERPRINT"
	} : (() => {
		throw new Error("Invalid release catalog scope key");
	})();
	if (createReleaseCatalogScopeKey(input) !== scopeKey) throw new Error("Release catalog scope key is not canonical");
	return input;
}
//#endregion
//#region src/uuid.ts
const NIL_UUID = "00000000-0000-0000-0000-000000000000";
const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const isUUIDv7 = (value) => typeof value === "string" && UUID_V7_PATTERN.test(value);
//#endregion
//#region src/releaseCatalogWire.ts
/** The largest release catalog response body a client accepts, in UTF-8 bytes. */
const MAX_RELEASE_CATALOG_WIRE_BYTES = 528384;
/** The length of `value` in UTF-8 bytes, without an encoder the device may lack. */
const getUtf8ByteLength = (value) => {
	let bytes = 0;
	for (let index = 0; index < value.length; index += 1) {
		const code = value.charCodeAt(index);
		if (code <= 127) bytes += 1;
		else if (code <= 2047) bytes += 2;
		else if (code >= 55296 && code <= 56319 && index + 1 < value.length && value.charCodeAt(index + 1) >= 56320 && value.charCodeAt(index + 1) <= 57343) {
			bytes += 4;
			index += 1;
		} else bytes += 3;
	}
	return bytes;
};
const isStringArray = (value) => Array.isArray(value) && value.every((entry) => typeof entry === "string");
const isValidReleaseDescriptor = (value) => {
	if (value === null || typeof value !== "object") return false;
	const descriptor = value;
	return isUUIDv7(descriptor.releaseId) && descriptor.kind === "BUNDLE" && typeof descriptor.bundleId === "string" && Number.isSafeInteger(descriptor.rolloutCohortCount) && descriptor.rolloutCohortCount >= 0 && descriptor.rolloutCohortCount <= 1e3 && isStringArray(descriptor.targetCohorts) && descriptor.targetCohorts.length <= 100 && typeof descriptor.shouldForceUpdate === "boolean" && (descriptor.message === null || typeof descriptor.message === "string");
};
/** Whether the catalog is the expected scope's. */
const hasExpectedReleaseCatalogScope = (catalog, expected) => {
	try {
		const parsed = parseReleaseCatalogScopeKey(catalog.scopeKey);
		return parsed.channelKey === expected.channelKey && parsed.platform === expected.platform && parsed.strategy === expected.strategy && (parsed.strategy === "APP_VERSION" || expected.strategy === "FINGERPRINT" && parsed.fingerprintHash === expected.fingerprintHash);
	} catch {
		return false;
	}
};
/**
* Parses a release catalog response body as a client accepts it: within the
* wire limit, in the schema's shape, for the expected scope, and within the
* cohort limits. Any other body is null. The device's update client and
* doctor's server checks both run this, so they accept the same catalogs.
*/
const parseReleaseCatalog = (body, expectedScope) => {
	if (getUtf8ByteLength(body) > MAX_RELEASE_CATALOG_WIRE_BYTES) return null;
	try {
		const catalog = JSON.parse(body);
		if (catalog.schemaVersion !== 1 || typeof catalog.catalogId !== "string" || catalog.catalogId.length === 0 || typeof catalog.scopeKey !== "string" || !Number.isSafeInteger(catalog.generation) || (catalog.generation ?? 0) < 1 || typeof catalog.catalogHash !== "string" || !/^sha256:[0-9a-f]{64}$/.test(catalog.catalogHash) || catalog.fallbackPolicy !== "BUILTIN_IF_ACTIVE_INELIGIBLE" || !Array.isArray(catalog.releases) || !catalog.releases.every(isValidReleaseDescriptor) || !Array.isArray(catalog.rollbackReleases) || !catalog.rollbackReleases.every(isValidReleaseDescriptor)) return null;
		if (!hasExpectedReleaseCatalogScope(catalog, expectedScope)) return null;
		if (new Set([...catalog.releases, ...catalog.rollbackReleases].flatMap((release) => release.targetCohorts)).size > 512) return null;
		return catalog;
	} catch {
		return null;
	}
};
//#endregion
//#region src/types.ts
const ARTIFACT_PROTOCOL_VERSION = 1;
/**
* Artifact protocol in which a device asks for the URLs of only the files it
* downloads one by one, after reusing local files and choosing the archive.
*/
const ARTIFACT_FILES_PROTOCOL_VERSION = 2;
/** Paths one artifact files request may resolve; a device splits more. */
const ARTIFACT_FILES_REQUEST_LIMIT = 100;
//#endregion
exports.ARTIFACT_FILES_PROTOCOL_VERSION = ARTIFACT_FILES_PROTOCOL_VERSION;
exports.ARTIFACT_FILES_REQUEST_LIMIT = ARTIFACT_FILES_REQUEST_LIMIT;
exports.ARTIFACT_PROTOCOL_VERSION = ARTIFACT_PROTOCOL_VERSION;
exports.DEFAULT_ROLLOUT_COHORT_COUNT = DEFAULT_ROLLOUT_COHORT_COUNT;
exports.INVALID_COHORT_ERROR_MESSAGE = INVALID_COHORT_ERROR_MESSAGE;
exports.MAX_COHORT_LENGTH = MAX_COHORT_LENGTH;
exports.MAX_COMPILED_CATALOG_BYTES = MAX_COMPILED_CATALOG_BYTES;
exports.MAX_CRASHED_BUNDLES = MAX_CRASHED_BUNDLES;
exports.MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE = MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE;
exports.MAX_RELEASE_CATALOG_WIRE_BYTES = MAX_RELEASE_CATALOG_WIRE_BYTES;
exports.MAX_TARGET_COHORTS_PER_RELEASE = MAX_TARGET_COHORTS_PER_RELEASE;
exports.NIL_UUID = NIL_UUID;
exports.NUMERIC_COHORT_SIZE = NUMERIC_COHORT_SIZE;
exports.RELEASE_CATALOG_FALLBACK_POLICY = RELEASE_CATALOG_FALLBACK_POLICY;
exports.RELEASE_CATALOG_SCHEMA_VERSION = RELEASE_CATALOG_SCHEMA_VERSION;
exports.assertCanonicalChannelName = assertCanonicalChannelName;
exports.assessCatalogAcceptance = assessCatalogAcceptance;
exports.authorizeReleaseTransition = authorizeReleaseTransition;
exports.canonicalizeAppVersion = canonicalizeAppVersion;
exports.createPluginHost = createPluginHost;
exports.createReleaseCatalogScopeKey = createReleaseCatalogScopeKey;
exports.createReleaseSelectionContextHash = createReleaseSelectionContextHash;
exports.decodeChannelKey = decodeChannelKey;
exports.defineClientPlugin = defineClientPlugin;
exports.encodeChannelKey = encodeChannelKey;
exports.getAssetBaseStorageUri = getAssetBaseStorageUri;
exports.getBundlePatch = getBundlePatch;
exports.getBundlePatches = getBundlePatches;
exports.getDefaultNumericCohort = getDefaultNumericCohort;
exports.getManifestFileHash = getManifestFileHash;
exports.getManifestStorageUri = getManifestStorageUri;
exports.getNumericCohortRolloutPosition = getNumericCohortRolloutPosition;
exports.getNumericCohortValue = getNumericCohortValue;
exports.getPatchBaseBundleId = getPatchBaseBundleId;
exports.getPatchBaseFileHash = getPatchBaseFileHash;
exports.getPatchFileHash = getPatchFileHash;
exports.getPatchStorageUri = getPatchStorageUri;
exports.getRolledOutNumericCohorts = getRolledOutNumericCohorts;
exports.getUtf8ByteLength = getUtf8ByteLength;
exports.hasExpectedReleaseCatalogScope = hasExpectedReleaseCatalogScope;
exports.isCohortEligibleForUpdate = isCohortEligibleForUpdate;
exports.isCustomCohort = isCustomCohort;
exports.isNumericCohort = isNumericCohort;
exports.isReleaseEligibleForCohort = isReleaseEligibleForCohort;
exports.isUUIDv7 = isUUIDv7;
exports.isValidCohort = isValidCohort;
exports.normalizeChannelName = normalizeChannelName;
exports.normalizeCohortValue = normalizeCohortValue;
exports.normalizeRolloutCohortCount = normalizeRolloutCohortCount;
exports.parseReleaseCatalog = parseReleaseCatalog;
exports.parseReleaseCatalogScopeKey = parseReleaseCatalogScopeKey;
exports.pluginStorageKey = pluginStorageKey;
exports.resolveBaseURL = resolveBaseURL;
exports.selectDesiredRelease = selectDesiredRelease;
