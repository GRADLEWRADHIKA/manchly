const require_handlerParameters = require("./handlerParameters.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/handlerReleaseCatalogRoutes.ts
const CATALOG_CONTENT_TYPE = "application/vnd.hot-updater.release-catalog+json; version=1";
const ARTIFACT_CONTENT_TYPE = "application/vnd.hot-updater.artifact+json; version=1";
const ARTIFACT_V2_CONTENT_TYPE = "application/vnd.hot-updater.artifact+json; version=2";
const ORIGIN_CACHE_TTL_MS = 5e3;
const ORIGIN_CACHE_MAX_ENTRIES = 128;
/** Marks the 404 of a scope that has no catalog. */
const NO_CATALOG_HEADER = "x-hot-updater-catalog";
/** A shared cache keeps a catalog, or a scope's lack of one, five seconds. */
const CATALOG_CACHE_CONTROL = "public, max-age=0, s-maxage=5";
/**
* The same five seconds for a CDN that reads `CDN-Cache-Control` (RFC 9213),
* such as Cloudflare's Workers Cache, which then ignores `Cache-Control`.
* `s-maxage` forbids serving stale, so there an expired catalog held requests
* at that location until the origin answered. Here, for five more seconds,
* the CDN answers with the expired copy while it revalidates in the
* background. `stale-if-error=0` keeps origin errors visible: without it,
* Cloudflare serves a stale copy on error indefinitely.
*
* A device can see a catalog up to 15 seconds after a deploy or a Roll back
* replaced it: the origin's 5-second catalog memo, then 5 seconds fresh and
* 5 stale at the CDN. A revoked API key can read a cached catalog up to
* 10 seconds. Devices and caches that don't read the header keep
* `Cache-Control`.
*/
const CATALOG_CDN_CACHE_CONTROL = "public, max-age=5, stale-while-revalidate=5, stale-if-error=0";
/** The paths of an artifact files request, or null when malformed. */
const readArtifactFilePaths = async (request) => {
	let body;
	try {
		body = await request.json();
	} catch {
		return null;
	}
	const paths = body?.paths;
	if (!Array.isArray(paths) || paths.length === 0 || paths.length > _hot_updater_protocol.ARTIFACT_FILES_REQUEST_LIMIT || !paths.every((path) => typeof path === "string" && path.length > 0) || new Set(paths).size !== paths.length) return null;
	return paths;
};
const privateNotFound = () => Response.json({ error: "Not found" }, {
	status: 404,
	headers: { "cache-control": "private, no-store" }
});
const badRequest = (error) => Response.json({ error }, {
	status: 400,
	headers: { "cache-control": "private, no-store" }
});
/**
* A 400 for a catalog path whose scope is malformed, such as a channel name
* where its base64url key belongs; null for a well-formed scope.
*/
const invalidScope = (input) => {
	try {
		(0, _hot_updater_protocol.createReleaseCatalogScopeKey)(input);
		return null;
	} catch (error) {
		return badRequest(error instanceof Error ? error.message : "Invalid Release Catalog scope");
	}
};
/**
* A scope with no catalog yet, such as a store version before its first
* OTA release: cached like a catalog, so its update checks don't all reach
* the origin, and it holds nothing an API key protects. The header tells it
* apart from a 404 for a wrong URL: clients read it as "no update", and
* doctor as a live catalog route.
*/
const missingCatalog = () => Response.json({ error: "Not found" }, {
	status: 404,
	headers: {
		"cache-control": CATALOG_CACHE_CONTROL,
		"cdn-cache-control": CATALOG_CDN_CACHE_CONTROL,
		vary: "Accept-Encoding",
		[NO_CATALOG_HEADER]: "none"
	}
});
const responseHash = async (body) => {
	const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
	return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
};
const catalogResponse = async (catalog, request) => {
	if (catalog === null) return missingCatalog();
	const body = JSON.stringify(catalog);
	const etag = `"sha256:${await responseHash(body)}"`;
	const headers = {
		"cache-control": CATALOG_CACHE_CONTROL,
		"cdn-cache-control": CATALOG_CDN_CACHE_CONTROL,
		"content-type": CATALOG_CONTENT_TYPE,
		etag,
		vary: "Accept-Encoding"
	};
	if (request.headers.get("if-none-match") === etag) return new Response(null, {
		headers,
		status: 304
	});
	return new Response(body, {
		headers,
		status: 200
	});
};
const createReleaseCatalogRouteHandlers = () => {
	const cache = /* @__PURE__ */ new Map();
	const inFlight = /* @__PURE__ */ new Map();
	const loadCatalog = async (key, load) => {
		const cached = cache.get(key);
		if (cached !== void 0 && cached.expiresAt > Date.now()) {
			cache.delete(key);
			cache.set(key, cached);
			return cached.catalog;
		}
		if (cached !== void 0) cache.delete(key);
		const pending = inFlight.get(key);
		if (pending !== void 0) return pending;
		const next = load().then((catalog) => {
			if (catalog !== null) {
				cache.set(key, {
					catalog,
					expiresAt: Date.now() + ORIGIN_CACHE_TTL_MS
				});
				while (cache.size > ORIGIN_CACHE_MAX_ENTRIES) {
					const oldestKey = cache.keys().next().value;
					if (oldestKey === void 0) break;
					cache.delete(oldestKey);
				}
			}
			return catalog;
		});
		inFlight.set(key, next);
		try {
			return await next;
		} finally {
			inFlight.delete(key);
		}
	};
	return {
		appVersionReleaseCatalog: async (params, request, { core }) => {
			const rawAppVersion = require_handlerParameters.requireRouteParam(params, "appVersion");
			const appVersion = (0, _hot_updater_plugin_core.canonicalizeAppVersion)(rawAppVersion);
			if (appVersion === null || appVersion !== rawAppVersion) return badRequest("Invalid app version");
			const input = {
				appVersion,
				channelKey: require_handlerParameters.requireRouteParam(params, "channelKey"),
				platform: require_handlerParameters.requirePlatformParam(params),
				strategy: "APP_VERSION"
			};
			const invalid = invalidScope(input);
			if (invalid) return invalid;
			return catalogResponse(await loadCatalog(`app-version:${JSON.stringify(input)}`, () => core.getReleaseCatalog(input)), request);
		},
		fingerprintReleaseCatalog: async (params, request, { core }) => {
			const input = {
				channelKey: require_handlerParameters.requireRouteParam(params, "channelKey"),
				fingerprintHash: require_handlerParameters.requireRouteParam(params, "fingerprintHash"),
				platform: require_handlerParameters.requirePlatformParam(params),
				strategy: "FINGERPRINT"
			};
			const invalid = invalidScope(input);
			if (invalid) return invalid;
			return catalogResponse(await loadCatalog(`fingerprint:${JSON.stringify(input)}`, () => core.getReleaseCatalog(input)), request);
		},
		artifactV2: async (params, _request, { core }) => {
			const info = await core.getArtifactInfo(require_handlerParameters.requireRouteParam(params, "targetBundleId"), require_handlerParameters.requireRouteParam(params, "currentBundleId"), 2);
			if (info === null) return privateNotFound();
			return new Response(JSON.stringify(info), {
				status: 200,
				headers: {
					"cache-control": "private, no-store",
					"content-type": ARTIFACT_V2_CONTENT_TYPE
				}
			});
		},
		artifactFilesV2: async (params, request, { core }) => {
			const paths = await readArtifactFilePaths(request);
			if (paths === null) return badRequest(`paths must be 1 to ${_hot_updater_protocol.ARTIFACT_FILES_REQUEST_LIMIT} unique strings`);
			const files = await core.getArtifactFiles(require_handlerParameters.requireRouteParam(params, "targetBundleId"), paths);
			if (files === null) return privateNotFound();
			return new Response(JSON.stringify(files), {
				status: 200,
				headers: {
					"cache-control": "private, no-store",
					"content-type": ARTIFACT_V2_CONTENT_TYPE
				}
			});
		},
		artifactV1: async (params, _request, { core }) => {
			const info = await core.getArtifactInfo(require_handlerParameters.requireRouteParam(params, "targetBundleId"), require_handlerParameters.requireRouteParam(params, "currentBundleId"), 1);
			if (info === null) return privateNotFound();
			return new Response(JSON.stringify(info), {
				status: 200,
				headers: {
					"cache-control": "private, no-store",
					"content-type": ARTIFACT_CONTENT_TYPE
				}
			});
		}
	};
};
//#endregion
exports.createReleaseCatalogRouteHandlers = createReleaseCatalogRouteHandlers;
