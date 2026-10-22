Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_schema = require("./schema.cjs");
const require_model = require("./model.cjs");
const require_official = require("./official.cjs");
const require_errors = require("./errors.cjs");
const require_provider = require("./provider.cjs");
const require_recordEvent = require("./recordEvent.cjs");
const require_reads = require("./reads.cjs");
const require_routes = require("./routes.cjs");
const require_adminReads = require("./adminReads.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/index.ts
const createInsightsApi = (db, now, retention) => ({
	/** How long this plugin keeps its rows. */
	retention,
	/** Records one validated event row; a repeated id changes nothing. */
	recordEvent: (event) => require_recordEvent.recordEvent(db, event),
	listEvents: (input) => require_reads.listEvents(db, input),
	findLatestEvents: (input) => require_reads.findLatestEvents(db, input),
	countLatestEvents: (input) => require_reads.countLatestEvents(db, input),
	countEvents: (input) => require_reads.countEvents(db, input),
	countEventSeries: (input) => require_reads.countEventSeries(db, input),
	getReleaseActivity: (input) => require_reads.getReleaseActivity(db, input, now),
	getAppUsage: (input) => require_reads.getAppUsage(db, input, now, retention),
	/** A release's or a channel's update failures, and their breakdown over a time range. */
	getUpdateFailures: (input) => require_reads.getUpdateFailures(db, input, now, retention)
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
	if (platform !== "ios" && platform !== "android" || start === void 0 !== (end === void 0)) throw new _hot_updater_plugin_core.DatabaseAdapterInputError("invalid-query");
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
			if (error instanceof _hot_updater_plugin_core.DatabaseAdapterInputError) return Response.json({ error: "Send platform and channel, and releaseId or start and end in epoch milliseconds, at most 30 days apart." }, { status: 400 });
			if (!(0, _hot_updater_plugin_core.isDatabaseBusyError)(error)) throw error;
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
	if (!whole(rawDays) || !whole(dailyDays) || dailyDays < rawDays) throw new _hot_updater_plugin_core.HotUpdaterConfigError(`insights({ retention }) takes whole days of at least 1, with dailyDays at least rawDays; got rawDays ${rawDays} and dailyDays ${dailyDays}.`);
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
	const plugin = (0, _hot_updater_plugin_core.definePlugin)({
		id: "insights",
		namespace: false,
		schemaVersion: "1.0.0",
		schema: require_schema.createInsightsSchema(retention),
		init: ({ db, now }) => {
			const api = createInsightsApi(db, now, retention);
			const routes = require_routes.createInsightsRouteHandlers(require_provider.createInsightsProvider(require_model.createInsightsModel(api)));
			return {
				api,
				endpoints: [
					...require_routes.INSIGHTS_ROUTES.map(({ access, method, path, handler }) => ({
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
	return require_official.markOfficial(plugin);
};
//#endregion
exports.DEFAULT_INSIGHTS_RETENTION = require_schema.DEFAULT_INSIGHTS_RETENTION;
exports.InsightsBadRequestError = require_errors.InsightsBadRequestError;
exports.createInsightsAdminReads = require_adminReads.createInsightsAdminReads;
exports.createInsightsModel = require_model.createInsightsModel;
exports.createInsightsProvider = require_provider.createInsightsProvider;
exports.createInsightsReads = require_adminReads.createInsightsReads;
exports.createInsightsSchema = require_schema.createInsightsSchema;
exports.insights = insights;
exports.insightsIdentity = require_recordEvent.insightsIdentity;
exports.insightsSchema = require_schema.insightsSchema;
