const require_errors = require("./errors.cjs");
const require_eventInput = require("./eventInput.cjs");
const require_queryInput = require("./queryInput.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/routes.ts
/** Seconds a client waits before it resends a request the busy database refused. */
const RETRY_AFTER_SECONDS = 5;
const json = (body, status, headers = {}) => Response.json(body, {
	headers: {
		"cache-control": "private, no-store",
		...headers
	},
	status
});
const requireParam = (params, key) => {
	const value = params[key];
	if (value === void 0 || value.length === 0) throw new require_errors.InsightsBadRequestError(`Missing route parameter: ${key}`);
	try {
		return decodeURIComponent(value);
	} catch {
		throw new require_errors.InsightsBadRequestError(`Invalid route parameter: ${key}`);
	}
};
const run = async (operation) => {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof require_errors.InsightsBadRequestError) return json({ error: error.message }, 400);
		if (error instanceof require_errors.InsightsPayloadTooLargeError) return json({ error: error.message }, 413);
		if ((0, _hot_updater_plugin_core.isDatabaseBusyError)(error)) {
			console.warn("[hot-updater] Insights answered 503: the database is busy.", error);
			return json({ error: "Service unavailable" }, 503, { "retry-after": String(RETRY_AFTER_SECONDS) });
		}
		throw error;
	}
};
const query = (operation) => run(async () => json(await operation(), 200));
/** Every Insights route: where it mounts, and the handler it runs. */
const INSIGHTS_ROUTES = [
	{
		access: "client",
		method: "POST",
		path: "/events",
		handler: "appendBundleEvent"
	},
	{
		access: "admin",
		method: "GET",
		path: "/events",
		handler: "listEvents"
	},
	{
		access: "admin",
		method: "GET",
		path: "/overview",
		handler: "getReportingOverview"
	},
	{
		access: "admin",
		method: "GET",
		path: "/installations",
		handler: "pageInstallationsByCurrentUserId"
	},
	{
		access: "admin",
		method: "GET",
		path: "/installations/:installId/events",
		handler: "listInstallationEvents"
	},
	{
		access: "admin",
		method: "GET",
		path: "/installations/:installId",
		handler: "getInstallation"
	}
];
const createInsightsRouteHandlers = (provider) => ({
	appendBundleEvent: async (_params, request) => run(async () => {
		await provider.appendBundleEvent(await require_eventInput.parseBundleEventRequest(request));
		return new Response(null, { status: 204 });
	}),
	getReportingOverview: (_params, request) => query(() => provider.getReportingOverview(require_queryInput.parseReportingOverviewInput(request))),
	getInstallation: (params) => run(async () => {
		const installation = await provider.getInstallation({ installId: requireParam(params, "installId") });
		return installation === null ? json({ error: "Installation not found" }, 404) : json(installation, 200);
	}),
	listEvents: (_params, request) => query(() => provider.listEvents(require_queryInput.parseEventPageInput(request))),
	listInstallationEvents: (params, request) => query(() => provider.listInstallationEvents({
		...require_queryInput.parseEventPageInput(request),
		installId: requireParam(params, "installId")
	})),
	pageInstallationsByCurrentUserId: (_params, request) => query(() => provider.pageInstallationsByCurrentUserId(require_queryInput.parseUserInstallationPageInput(request)))
});
//#endregion
exports.INSIGHTS_ROUTES = INSIGHTS_ROUTES;
exports.createInsightsRouteHandlers = createInsightsRouteHandlers;
