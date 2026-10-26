import { HotUpdaterConfigError } from "./assembly/configError.mjs";
import { HandlerBadRequestError } from "./handlerErrors.mjs";
import { ADMIN_ROUTES, createAdminRouteHandlers } from "./handlerAdminRoutes.mjs";
import { createReleaseCatalogRouteHandlers } from "./handlerReleaseCatalogRoutes.mjs";
import { createVersionRouteHandlers } from "./handlerVersionRoutes.mjs";
import { addRoute, createRouter, findRoute } from "./internalRouter.mjs";
import { HotUpdaterSchemaMigrationRequiredError } from "@hot-updater/plugin-core";
//#region src/handler.ts
const withPrivateNoStore = (response) => {
	const headers = new Headers(response.headers);
	headers.set("cache-control", "private, no-store");
	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText
	});
};
const errorResponse = (error, status) => Response.json({ error }, {
	headers: { "cache-control": "private, no-store" },
	status
});
/** `/version` never passes through the client policy. */
const PUBLIC_CLIENT_ROUTES = /* @__PURE__ */ new Set(["version"]);
const routesOf = Symbol.for("@hot-updater/server/routes");
const withVary = (response, varyHeaders) => {
	const cacheControl = response.headers.get("cache-control") ?? "";
	if (varyHeaders.length === 0 || cacheControl === "" || /private|no-store/u.test(cacheControl)) return response;
	const headers = new Headers(response.headers);
	headers.set("vary", [response.headers.get("vary"), ...varyHeaders].filter(Boolean).join(", "));
	return new Response(response.body, {
		headers,
		status: response.status,
		statusText: response.statusText
	});
};
const createRequestHandler = ({ api, clientPolicy, privateResponses = false, routeHandlers, router }) => async (request) => {
	try {
		const match = findRoute(router, request.method, new URL(request.url).pathname);
		if (!match) return errorResponse("Not found", 404);
		const guarded = clientPolicy !== void 0 && !PUBLIC_CLIENT_ROUTES.has(match.data);
		if (guarded) {
			let authenticated;
			try {
				authenticated = await clientPolicy.authenticate(request);
			} catch {
				return errorResponse("Service unavailable", 503);
			}
			if (!authenticated) return errorResponse("Unauthorized", 401);
		}
		const handler = routeHandlers[match.data];
		if (!handler) return errorResponse("Handler not found", 500);
		const response = await handler(match.params, request, api);
		if (privateResponses) return withPrivateNoStore(response);
		return guarded ? withVary(response, clientPolicy.varyHeaders) : response;
	} catch (error) {
		if (error instanceof HandlerBadRequestError) return errorResponse(error.message, 400);
		if (error instanceof HotUpdaterSchemaMigrationRequiredError) {
			console.error(error.message);
			return errorResponse("Service unavailable", 503);
		}
		console.error("Hot Updater handler error:", error);
		return Response.json({ error: "Internal server error" }, {
			headers: { "cache-control": "private, no-store" },
			status: 500
		});
	}
};
function createHotUpdaterHandlers({ api, clientPolicy, endpoints = [], plugins = [] }) {
	const routeHandlers = {
		...createVersionRouteHandlers(plugins),
		...createReleaseCatalogRouteHandlers(),
		...createAdminRouteHandlers()
	};
	const routes = [];
	const shapes = /* @__PURE__ */ new Map();
	const mount = (router, admin) => (method, path, handler) => {
		const shape = `${admin ? "admin" : "client"} ${method} ${path.replaceAll(/:[^/]+/gu, ":")}`;
		const taken = shapes.get(shape);
		if (taken !== void 0) throw new HotUpdaterConfigError(`${handler} (${method} ${path}) collides with ${taken} on handlers.${admin ? "admin" : "client"}.`);
		shapes.set(shape, handler);
		addRoute(router, method, path, handler);
		routes.push({
			method,
			path,
			access: admin ? "admin" : PUBLIC_CLIENT_ROUTES.has(handler) ? "public" : "client"
		});
	};
	const clientRouter = createRouter();
	const addClientRoute = mount(clientRouter, false);
	addClientRoute("GET", "/version", "version");
	addClientRoute("GET", "/release-catalogs/app-version/:platform/:channelKey/:appVersion", "appVersionReleaseCatalog");
	addClientRoute("GET", "/release-catalogs/fingerprint/:platform/:channelKey/:fingerprintHash", "fingerprintReleaseCatalog");
	addClientRoute("GET", "/artifacts/v1/:targetBundleId/from/:currentBundleId", "artifactV1");
	addClientRoute("GET", "/artifacts/v2/:targetBundleId/from/:currentBundleId", "artifactV2");
	addClientRoute("POST", "/artifacts/v2/:targetBundleId/files", "artifactFilesV2");
	const adminRouter = createRouter();
	const addAdminRoute = mount(adminRouter, true);
	addAdminRoute("GET", "/version", "adminVersion");
	for (const route of ADMIN_ROUTES) addAdminRoute(route.method, route.path, route.handler);
	for (const endpoint of endpoints) {
		const name = `plugin ${endpoint.plugin}: ${endpoint.method} ${endpoint.path}`;
		routeHandlers[name] = (params, request) => endpoint.handler(request, params);
		(endpoint.access === "admin" ? addAdminRoute : addClientRoute)(endpoint.method, endpoint.path, name);
	}
	const handlers = {
		client: createRequestHandler({
			api,
			...clientPolicy === void 0 ? {} : { clientPolicy },
			routeHandlers,
			router: clientRouter
		}),
		admin: createRequestHandler({
			api,
			privateResponses: true,
			routeHandlers,
			router: adminRouter
		})
	};
	Object.defineProperty(handlers, routesOf, { value: Object.freeze(routes) });
	return Object.freeze(handlers);
}
//#endregion
export { createHotUpdaterHandlers };
