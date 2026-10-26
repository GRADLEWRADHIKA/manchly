import { InsightsBadRequestError, InsightsPayloadTooLargeError } from "./errors.mjs";
import { parseBundleEventRequest } from "./eventInput.mjs";
import { parseEventPageInput, parseReportingOverviewInput, parseUserInstallationPageInput } from "./queryInput.mjs";
import { isDatabaseBusyError } from "@hot-updater/plugin-core";
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
	if (value === void 0 || value.length === 0) throw new InsightsBadRequestError(`Missing route parameter: ${key}`);
	try {
		return decodeURIComponent(value);
	} catch {
		throw new InsightsBadRequestError(`Invalid route parameter: ${key}`);
	}
};
const run = async (operation) => {
	try {
		return await operation();
	} catch (error) {
		if (error instanceof InsightsBadRequestError) return json({ error: error.message }, 400);
		if (error instanceof InsightsPayloadTooLargeError) return json({ error: error.message }, 413);
		if (isDatabaseBusyError(error)) {
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
		await provider.appendBundleEvent(await parseBundleEventRequest(request));
		return new Response(null, { status: 204 });
	}),
	getReportingOverview: (_params, request) => query(() => provider.getReportingOverview(parseReportingOverviewInput(request))),
	getInstallation: (params) => run(async () => {
		const installation = await provider.getInstallation({ installId: requireParam(params, "installId") });
		return installation === null ? json({ error: "Installation not found" }, 404) : json(installation, 200);
	}),
	listEvents: (_params, request) => query(() => provider.listEvents(parseEventPageInput(request))),
	listInstallationEvents: (params, request) => query(() => provider.listInstallationEvents({
		...parseEventPageInput(request),
		installId: requireParam(params, "installId")
	})),
	pageInstallationsByCurrentUserId: (_params, request) => query(() => provider.pageInstallationsByCurrentUserId(parseUserInstallationPageInput(request)))
});
//#endregion
export { INSIGHTS_ROUTES, createInsightsRouteHandlers };
