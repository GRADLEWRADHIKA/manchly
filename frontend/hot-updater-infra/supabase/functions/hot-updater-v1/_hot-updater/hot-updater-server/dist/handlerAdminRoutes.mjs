import { HandlerBadRequestError } from "./handlerErrors.mjs";
import { decodeMaybe, isPlatform, parseBooleanSearchParam, requireRouteParam } from "./handlerParameters.mjs";
import { DatabaseBundleNotFoundError, DatabaseRowReferencedError, ReleaseCatalogMutationError, ReleaseManagementError } from "@hot-updater/plugin-core";
//#region src/handlerAdminRoutes.ts
const json = (body, status = 200) => Response.json(body, { status });
const notFound = () => json({ error: "Not found" }, 404);
const noContent = () => new Response(null, { status: 204 });
/** Runs `route` on core, answering its refusals. */
const onCore = (route) => async (params, request, api) => answer(() => route(api.core, request, params));
/** Core's refusals as HTTP answers; anything else is a server error. */
const answer = async (operation) => {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof ReleaseManagementError || error instanceof ReleaseCatalogMutationError) {
			const status = error.code === "RELEASE_NOT_FOUND" ? 404 : error.code === "VERSION_CONFLICT" ? 409 : 400;
			return json({
				code: error.code,
				error: error.message
			}, status);
		}
		if (error instanceof DatabaseBundleNotFoundError) return json({
			code: "BUNDLE_NOT_FOUND",
			error: error.message
		}, 404);
		if (error instanceof DatabaseRowReferencedError) return json({
			code: "REFERENCED",
			error: error.message
		}, 409);
		throw error;
	}
};
const LIMITS = {
	defaultValue: 50,
	maxValue: 500
};
/** `order`, `cursor`, and `limit`: one keyset page. */
const keyset = (url, maxValue = LIMITS.maxValue) => {
	const order = url.searchParams.get("order") ?? "desc";
	if (order !== "asc" && order !== "desc") throw new HandlerBadRequestError("order must be 'asc' or 'desc'.");
	const limitParam = url.searchParams.get("limit");
	const limit = limitParam === null ? Math.min(LIMITS.defaultValue, maxValue) : Number(limitParam);
	if (!Number.isSafeInteger(limit) || limit < 1 || limit > maxValue) throw new HandlerBadRequestError(`limit must be between 1 and ${maxValue}.`);
	const cursor = url.searchParams.get("cursor");
	return {
		order,
		limit,
		...cursor === null ? {} : { after: cursor }
	};
};
/** A page and the cursor of the next one, when the page is full. */
const page = (rows, { limit }, keyOf, extra = {}) => json({
	data: rows,
	...rows.length === limit && rows.length > 0 ? { next: keyOf(rows.at(-1)) } : {},
	...extra
});
const platformOf = (url) => {
	const platform = url.searchParams.get("platform");
	if (platform === null) return void 0;
	if (!isPlatform(platform)) throw new HandlerBadRequestError(`Invalid platform: ${platform}. Expected 'ios' or 'android'.`);
	return platform;
};
/** The one filter set a release list names; any other mix of filters is refused. */
const releaseFilter = (url) => {
	const params = url.searchParams;
	const named = [
		"channelId",
		"platform",
		"bundleId",
		"scopeKey"
	].filter((name) => params.has(name));
	const enabled = parseBooleanSearchParam(url, "enabled");
	const withEnabled = enabled === void 0 ? {} : { enabled };
	const set = named.join(",");
	if (set === "" && enabled === void 0) return { kind: "all" };
	if (set === "channelId,platform") {
		const platform = platformOf(url);
		return {
			kind: "channelPlatform",
			channelId: params.get("channelId"),
			platform,
			...withEnabled
		};
	}
	if (set === "bundleId" && enabled === void 0) return {
		kind: "bundle",
		bundleId: params.get("bundleId")
	};
	if (set === "scopeKey") return {
		kind: "scope",
		scopeKey: params.get("scopeKey"),
		...withEnabled
	};
	throw new HandlerBadRequestError("Releases filter by none, channelId and platform (with enabled), bundleId, or scopeKey (with enabled).");
};
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const body = async (request) => {
	const value = await request.json();
	if (!isRecord(value)) throw new HandlerBadRequestError("Invalid body");
	return value;
};
const isText = (value) => typeof value === "string" && value.length > 0;
const isTextOrNull = (value) => value === null || isText(value);
const isBundle = (bundle) => isRecord(bundle) && isText(bundle.id) && typeof bundle.platform === "string" && isPlatform(bundle.platform) && isTextOrNull(bundle.gitCommitHash) && isText(bundle.manifestStorageUri) && isText(bundle.manifestFileHash) && isText(bundle.assetBaseStorageUri) && (bundle.metadata === void 0 || isRecord(bundle.metadata)) && (bundle.patches === void 0 || bundle.patches === null || Array.isArray(bundle.patches));
const isReleasePolicy = (release) => isRecord(release) && isText(release.channel) && typeof release.enabled === "boolean" && typeof release.shouldForceUpdate === "boolean" && isTextOrNull(release.fingerprintHash) && isTextOrNull(release.targetAppVersion) && (release.message === null || typeof release.message === "string") && (release.rolloutCohortCount === void 0 || Number.isSafeInteger(release.rolloutCohortCount) && release.rolloutCohortCount >= 0 && release.rolloutCohortCount <= 1e3) && (release.targetCohorts === void 0 || Array.isArray(release.targetCohorts) && release.targetCohorts.every(isText));
/** A deployment's shape: a new bundle or a stored bundle's id, and its release policy. */
const isDeployment = (value) => isRecord(value) && isReleasePolicy(value.release) && ("bundleId" in value ? isText(value.bundleId) && !("bundle" in value) : isBundle(value.bundle));
/** An expected release revision from a body number or a query string. */
const revisionOf = (value) => {
	if (value === void 0 || value === null || value === "") return void 0;
	const revision = typeof value === "string" ? Number(value) : value;
	if (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 1) throw new HandlerBadRequestError("Invalid expected Release revision");
	return revision;
};
/** A policy change's body: `{ expectedRevision?, patch }`. */
const policyInput = async (request) => {
	const input = await body(request);
	if (!isRecord(input.patch)) throw new HandlerBadRequestError("Invalid Release policy mutation");
	const expectedRevision = revisionOf(input.expectedRevision);
	return {
		patch: input.patch,
		...expectedRevision === void 0 ? {} : { expectedRevision }
	};
};
/** A bundle update's body: the fields it changes, never another bundle's id. */
const bundleUpdateOf = (value, bundleId) => {
	if (!isRecord(value)) throw new HandlerBadRequestError("Invalid bundle payload");
	const { id, ...update } = value;
	if (id !== void 0 && id !== bundleId) throw new HandlerBadRequestError("Bundle id mismatch");
	return update;
};
const scopeKeyOf = (params) => decodeMaybe(requireRouteParam(params, "scopeKey")) ?? "";
/** Every admin route's handler, by the name `ADMIN_ROUTES` mounts it under. */
const createAdminRouteHandlers = () => ({
	listBundles: onCore(async (core, request) => {
		const url = new URL(request.url);
		const input = keyset(url, 100);
		const platform = platformOf(url);
		const withTotal = parseBooleanSearchParam(url, "total") === true;
		const [rows, total] = await Promise.all([core.listBundles({
			...input,
			...platform ? { platform } : {}
		}), withTotal ? core.countBundles(platform) : void 0]);
		return page(rows, input, (row) => row.bundle.id, total === void 0 ? {} : { total });
	}),
	getBundle: onCore(async (core, _request, params) => {
		const detail = await core.getBundle(requireRouteParam(params, "id"));
		return detail === null ? notFound() : json({ data: detail });
	}),
	listReleases: onCore(async (core, request) => {
		const url = new URL(request.url);
		const input = keyset(url);
		const rows = await core.listReleases({
			...input,
			filter: releaseFilter(url)
		});
		return page(rows, input, (row) => row.id);
	}),
	listReleaseCatalogs: onCore(async (core, request) => {
		const input = keyset(new URL(request.url));
		const rows = await core.listReleaseCatalogs(input);
		return page(rows, input, (row) => row.scope_key);
	}),
	/** With `name`, the one channel of that name: 1 read. */
	getChannels: onCore(async (core, request) => {
		const name = new URL(request.url).searchParams.get("name");
		if (name === null) return json({ data: await core.listChannels() });
		const channel = await core.findChannelByName(name);
		return channel === null ? notFound() : json({ data: channel });
	}),
	/** The channel named in the body, created when missing. */
	createChannel: onCore(async (core, request) => {
		const { name } = await body(request);
		if (typeof name !== "string" || name.trim().length === 0) throw new HandlerBadRequestError("Invalid channel name");
		return json({ data: await core.ensureChannel(name) });
	}),
	/** 204 when deleted; 404 or 409 with the reason otherwise. */
	deleteChannel: onCore(async (core, _request, params) => {
		const result = await core.deleteChannel(decodeMaybe(requireRouteParam(params, "id")) ?? "");
		if (result.deleted) return noContent();
		return json({ data: result }, result.reason === "not_found" ? 404 : 409);
	}),
	getRelease: onCore(async (core, _request, params) => {
		const row = await core.getRelease(requireRouteParam(params, "id"));
		return row === null ? notFound() : json({ data: row });
	}),
	updateRelease: onCore(async (core, request, params) => json({ data: await core.updateReleasePolicy({
		...await policyInput(request),
		releaseId: requireRouteParam(params, "id")
	}) })),
	preflightRelease: onCore(async (core, request, params) => json({ data: await core.preflightReleasePolicy({
		...await policyInput(request),
		releaseId: requireRouteParam(params, "id")
	}) })),
	/** Hard deletion names the release twice: in the path and as `confirm`. */
	deleteRelease: onCore(async (core, request, params) => {
		const releaseId = requireRouteParam(params, "id");
		const url = new URL(request.url);
		if (url.searchParams.get("confirm") !== releaseId) throw new HandlerBadRequestError("Release hard deletion requires confirm=<release-id>");
		const expectedRevision = revisionOf(url.searchParams.get("expectedRevision"));
		return json({ data: await core.deleteRelease({
			releaseId,
			...expectedRevision === void 0 ? {} : { expectedRevision }
		}) });
	}),
	getReleaseCatalogRow: onCore(async (core, _request, params) => {
		const row = await core.getReleaseCatalogRow(scopeKeyOf(params));
		return row === null ? notFound() : json({ data: row });
	}),
	rebuildReleaseCatalog: onCore(async (core, _request, params) => json({ data: await core.rebuildReleaseCatalog(scopeKeyOf(params)) })),
	updateBundle: onCore(async (core, request, params) => {
		const bundleId = requireRouteParam(params, "id");
		await core.updateBundle(bundleId, bundleUpdateOf(await request.json(), bundleId));
		return noContent();
	}),
	countBundles: onCore(async (core, request) => json({ data: await core.countBundles(platformOf(new URL(request.url))) })),
	countBundleChildren: onCore(async (core, request) => {
		const ids = (new URL(request.url).searchParams.get("ids") ?? "").split(",").filter((id) => id.length > 0);
		if (ids.length === 0 || ids.length > 100) throw new HandlerBadRequestError("Bundle child counts take ids=<bundle id>,... with 1 to 100 ids.");
		return json({ data: await core.countBundleChildren(ids) });
	}),
	listBundleChildren: onCore(async (core, request, params) => {
		const input = keyset(new URL(request.url));
		const rows = await core.listPatchesFromBase(requireRouteParam(params, "id"), input);
		return page(rows, input, (row) => row.bundle_id);
	}),
	findBaseCandidates: onCore(async (core, request, params) => {
		const url = new URL(request.url);
		const before = url.searchParams.get("before");
		const limit = Number(url.searchParams.get("limit") ?? "3");
		if (before === null || !Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new HandlerBadRequestError("Base candidates need before=<bundle id> and a limit between 1 and 100.");
		return json({ data: await core.findBaseBundleIds(decodeMaybe(requireRouteParam(params, "candidateKey")) ?? "", before, limit) });
	}),
	deployReleases: onCore(async (core, request) => {
		const { deployments } = await body(request);
		if (!Array.isArray(deployments) || deployments.length === 0 || !deployments.every(isDeployment)) throw new HandlerBadRequestError("Deploy needs deployments, each a bundle and its release policy.");
		return json({ data: await core.deploy(deployments) }, 201);
	}),
	promoteRelease: onCore(async (core, request, params) => {
		const input = await body(request);
		if (typeof input.targetChannel !== "string" || input.action !== void 0 && input.action !== "copy" && input.action !== "move") throw new HandlerBadRequestError("Invalid Release promotion");
		const expectedRevision = revisionOf(input.expectedRevision);
		return json({ data: await core.promoteRelease({
			releaseId: requireRouteParam(params, "id"),
			targetChannel: input.targetChannel,
			...input.action === void 0 ? {} : { action: input.action },
			...expectedRevision === void 0 ? {} : { expectedRevision }
		}) });
	}),
	preflightReleaseCatalogRebuild: onCore(async (core, _request, params) => json({ data: await core.preflightReleaseCatalogRebuild(scopeKeyOf(params)) })),
	deleteBundles: onCore(async (core, request) => {
		const { ids } = await body(request);
		if (!Array.isArray(ids) || !ids.every((id) => typeof id === "string" && id.length > 0)) throw new HandlerBadRequestError("Bundle deletion needs ids");
		await core.deleteBundles(ids);
		return noContent();
	})
});
/** The admin mount's routes, by the handler that serves each. */
const ADMIN_ROUTES = [
	{
		method: "POST",
		path: "/releases",
		handler: "deployReleases"
	},
	{
		method: "POST",
		path: "/releases/:id/promote",
		handler: "promoteRelease"
	},
	{
		method: "GET",
		path: "/releases/:id",
		handler: "getRelease"
	},
	{
		method: "GET",
		path: "/releases",
		handler: "listReleases"
	},
	{
		method: "PATCH",
		path: "/releases/:id",
		handler: "updateRelease"
	},
	{
		method: "POST",
		path: "/releases/:id/preflight",
		handler: "preflightRelease"
	},
	{
		method: "DELETE",
		path: "/releases/:id",
		handler: "deleteRelease"
	},
	{
		method: "GET",
		path: "/release-catalogs/:scopeKey",
		handler: "getReleaseCatalogRow"
	},
	{
		method: "GET",
		path: "/release-catalogs",
		handler: "listReleaseCatalogs"
	},
	{
		method: "POST",
		path: "/release-catalogs/:scopeKey/rebuild",
		handler: "rebuildReleaseCatalog"
	},
	{
		method: "POST",
		path: "/release-catalogs/:scopeKey/preflight",
		handler: "preflightReleaseCatalogRebuild"
	},
	{
		method: "GET",
		path: "/channels",
		handler: "getChannels"
	},
	{
		method: "POST",
		path: "/channels",
		handler: "createChannel"
	},
	{
		method: "DELETE",
		path: "/channels/:id",
		handler: "deleteChannel"
	},
	{
		method: "GET",
		path: "/bundles/count",
		handler: "countBundles"
	},
	{
		method: "GET",
		path: "/bundles/child-counts",
		handler: "countBundleChildren"
	},
	{
		method: "GET",
		path: "/bundles/:id",
		handler: "getBundle"
	},
	{
		method: "GET",
		path: "/bundles",
		handler: "listBundles"
	},
	{
		method: "PATCH",
		path: "/bundles/:id",
		handler: "updateBundle"
	},
	{
		method: "POST",
		path: "/bundles/delete",
		handler: "deleteBundles"
	},
	{
		method: "GET",
		path: "/bundles/:id/children",
		handler: "listBundleChildren"
	},
	{
		method: "GET",
		path: "/base-candidates/:candidateKey",
		handler: "findBaseCandidates"
	}
];
//#endregion
export { ADMIN_ROUTES, answer, createAdminRouteHandlers };
