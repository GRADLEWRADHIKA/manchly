const require_contract = require("./contract.cjs");
//#region src/server/model.ts
/**
* The plugin's API as `InsightsModel`, validated at its boundary: what the
* Insights routes, the console, and the e2e harness read through.
*/
const createInsightsModel = (api) => require_contract.createValidatedInsightsModel({
	recordEvent: ({ event }) => api.recordEvent(event),
	listEvents: api.listEvents,
	findLatestEvents: api.findLatestEvents,
	countLatestEvents: api.countLatestEvents,
	countEvents: api.countEvents,
	countEventSeries: api.countEventSeries,
	getReleaseActivity: api.getReleaseActivity,
	getAppUsage: api.getAppUsage
});
//#endregion
exports.createInsightsModel = createInsightsModel;
