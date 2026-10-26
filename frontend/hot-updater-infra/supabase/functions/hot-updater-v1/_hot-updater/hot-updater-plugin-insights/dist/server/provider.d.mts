import { InsightsModel } from "./modelTypes.mjs";
import { InsightsProvider } from "./types.mjs";
//#region src/server/provider.d.ts
declare const createInsightsProvider: (model: InsightsModel) => InsightsProvider;
//#endregion
export { createInsightsProvider };