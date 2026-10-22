import { createInsightsModel } from "./model.mjs";
import { createInsightsProvider } from "./provider.mjs";
//#region src/server/adminReads.ts
/** The reads over the `insights()` API tooling assembled on the server's database. */
const createInsightsReads = (api) => ({
	...createInsightsProvider(createInsightsModel(api)),
	getRetention: async () => api.retention,
	getUpdateFailures: api.getUpdateFailures
});
/** The `error` a failed admin route answered with, or a message naming its status. */
const errorOf = async (response, path) => {
	const body = await response.json().catch(() => null);
	return new Error(typeof body === "object" && body !== null && typeof Reflect.get(body, "error") === "string" ? String(Reflect.get(body, "error")) : `The server answered ${path.split("?")[0]} with ${response.status}.`);
};
const withQuery = (path, input) => {
	const query = new URLSearchParams();
	for (const [key, value] of Object.entries(input)) if (value !== void 0) query.set(key, String(value));
	const value = query.toString();
	return value.length === 0 ? path : `${path}?${value}`;
};
const eventQuery = ({ beforeReceivedAtMs, sinceMs, cursor, limit }) => ({
	beforeReceivedAtMs,
	sinceMs,
	cursor,
	limit
});
/**
* The reads over a self-hosted server's admin routes, which its `insights()`
* serves, for tooling that reaches it through `standaloneRepository`.
*/
const createInsightsAdminReads = (fetchAdmin, { unavailable = () => /* @__PURE__ */ new Error("The server runs without insights(): its admin API serves no Insights routes.") } = {}) => {
	const read = async (path) => {
		const response = await fetchAdmin(path);
		if (response.status === 404) return null;
		if (!response.ok) throw await errorOf(response, path);
		return await response.json();
	};
	const required = async (path) => {
		const value = await read(path);
		if (value === null) throw unavailable();
		return value;
	};
	return {
		getReportingOverview: ({ platform, channel, window, bundleId }) => required(withQuery("/overview", {
			platform,
			channel,
			window,
			bundleId
		})),
		listEvents: ({ bundle, ...input }) => required(withQuery("/events", {
			...eventQuery(input),
			...bundle === void 0 ? {} : {
				platform: bundle.platform,
				channel: bundle.channel,
				bundleId: bundle.bundleId,
				outcome: bundle.outcome
			}
		})),
		listInstallationEvents: ({ installId, ...input }) => required(withQuery(`/installations/${encodeURIComponent(installId)}/events`, eventQuery(input))),
		getInstallation: ({ installId }) => read(`/installations/${encodeURIComponent(installId)}`),
		pageInstallationsByCurrentUserId: ({ userId, cursor, limit }) => required(withQuery("/installations", {
			userId,
			cursor,
			limit
		})),
		getUpdateFailures: ({ platform, channel, releaseId, timeRange }) => required(withQuery("/failures", {
			platform,
			channel,
			releaseId,
			start: timeRange?.start,
			end: timeRange?.end
		})),
		getRetention: () => required("/retention")
	};
};
//#endregion
export { createInsightsAdminReads, createInsightsReads };
