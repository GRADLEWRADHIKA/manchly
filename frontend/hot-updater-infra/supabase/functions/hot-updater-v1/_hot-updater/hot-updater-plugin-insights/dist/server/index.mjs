import { DEFAULT_INSIGHTS_RETENTION, createInsightsSchema, insightsSchema } from "./schema.mjs";
import { createInsightsModel } from "./model.mjs";
import { markOfficial } from "./official.mjs";
import { InsightsBadRequestError } from "./errors.mjs";
import { createInsightsProvider } from "./provider.mjs";
import { insightsIdentity, recordEvent } from "./recordEvent.mjs";
import { countEventSeries, countEvents, countLatestEvents, findLatestEvents, getAppUsage, getReleaseActivity, getUpdateFailures, listEvents } from "./reads.mjs";
import { INSIGHTS_ROUTES, createInsightsRouteHandlers } from "./routes.mjs";
import { createInsightsAdminReads, createInsightsReads } from "./adminReads.mjs";
import { DatabaseAdapterInputError, HotUpdaterConfigError, definePlugin, isDatabaseBusyError } from "@hot-updater/plugin-core";
//#region src/server/index.ts
const createInsightsApi = (db, now, retention) => ({
	/** How long this plugin keeps its rows. */
	retention,
	/** Records one validated event row; a repeated id changes nothing. */
	recordEvent: (event) => recordEvent(db, event),
	listEvents: (input) => listEvents(db, input),
	findLatestEvents: (input) => findLatestEvents(db, input),
	countLatestEvents: (input) => countLatestEvents(db, input),
	countEvents: (input) => countEvents(db, input),
	countEventSeries: (input) => countEventSeries(db, input),
	getReleaseActivity: (input) => getReleaseActivity(db, input, now),
	getAppUsage: (input) => getAppUsage(db, input, now, retention),
	/** A release's or a channel's update failures, and their breakdown over a time range. */
	getUpdateFailures: (input) => getUpdateFailures(db, input, now, retention)
});
/** `GET /failures`'s query: a scope, an optional release, and a time range or none. */
const readFailuresQuery = (url) => {
	const query = url.searchParams;
	const time = (name) => {
		const value = query.get(name);
		return value === null ? void 0 : Number(value);
	};
	const [start, end] = [time("start"), time("end")];
	const platform = query.get("platform");
	const releaseId = query.get("releaseId");
	if (platform !== "ios" && platform !== "android" || start === void 0 !== (end === void 0)) throw new DatabaseAdapterInputError("invalid-query");
	return {
		platform,
		channel: query.get("channel") ?? "",
		...releaseId === null ? {} : { releaseId },
		...start === void 0 ? {} : { timeRange: {
			start,
			end
		} }
	};
};
/**
* The admin route of the update failures read: a release's (`releaseId`)
* since its first report, or over `start`–`end`, or a channel's over a range,
* which covers at most 30 days.
*/
const failuresEndpoint = (api) => ({
	access: "admin",
	method: "GET",
	path: "/failures",
	handler: async (request) => {
		try {
			return Response.json(await api.getUpdateFailures(readFailuresQuery(new URL(request.url))), { headers: { "cache-control": "private, no-store" } });
		} catch (error) {
			if (error instanceof DatabaseAdapterInputError) return Response.json({ error: "Send platform and channel, and releaseId or start and end in epoch milliseconds, at most 30 days apart." }, { status: 400 });
			if (!isDatabaseBusyError(error)) throw error;
			return Response.json({ error: "Service unavailable" }, {
				status: 503,
				headers: { "retry-after": "5" }
			});
		}
	}
});
const retentionOf = ({ retention }) => {
	const rawDays = retention?.rawDays ?? 90;
	const dailyDays = retention?.dailyDays ?? 400;
	const whole = (days) => Number.isSafeInteger(days) && days >= 1;
	if (!whole(rawDays) || !whole(dailyDays) || dailyDays < rawDays) throw new HotUpdaterConfigError(`insights({ retention }) takes whole days of at least 1, with dailyDays at least rawDays; got rawDays ${rawDays} and dailyDays ${dailyDays}.`);
	return {
		rawDays,
		dailyDays
	};
};
/**
* Insights: bundle lifecycle events and update failures, each
* installation's latest event, and the counters, gauges, and sketches its
* reads come from, each kept for its retention. It serves `POST /events` to
* clients, and the Insights reads, update failures, and retention to admins.
*/
const insights = (options = {}) => {
	const retention = retentionOf(options);
	const plugin = definePlugin({
		id: "insights",
		namespace: false,
		schemaVersion: "1.0.0",
		schema: createInsightsSchema(retention),
		init: ({ db, now }) => {
			const api = createInsightsApi(db, now, retention);
			const routes = createInsightsRouteHandlers(createInsightsProvider(createInsightsModel(api)));
			return {
				api,
				endpoints: [
					...INSIGHTS_ROUTES.map(({ access, method, path, handler }) => ({
						access,
						method,
						path,
						handler: (request, params) => routes[handler](params, request)
					})),
					failuresEndpoint(api),
					{
						access: "admin",
						method: "GET",
						path: "/retention",
						handler: async () => Response.json(retention)
					}
				]
			};
		},
		cli: { clientPlugin: {
			module: "@hot-updater/react-native",
			name: "insights"
		} }
	});
	return markOfficial(plugin);
};
//#endregion
export { DEFAULT_INSIGHTS_RETENTION, InsightsBadRequestError, createInsightsAdminReads, createInsightsModel, createInsightsProvider, createInsightsReads, createInsightsSchema, insights, insightsIdentity, insightsSchema };
