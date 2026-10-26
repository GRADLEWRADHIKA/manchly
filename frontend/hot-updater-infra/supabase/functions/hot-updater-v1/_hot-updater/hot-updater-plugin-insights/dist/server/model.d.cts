import { InsightsModel } from "./modelTypes.cjs";
import { InsightsApi } from "./index.cjs";
//#region src/server/model.d.ts
/**
 * The plugin's API as `InsightsModel`, validated at its boundary: what the
 * Insights routes, the console, and the e2e harness read through.
 */
declare const createInsightsModel: (api: InsightsApi) => InsightsModel;
//#endregion
export { createInsightsModel };