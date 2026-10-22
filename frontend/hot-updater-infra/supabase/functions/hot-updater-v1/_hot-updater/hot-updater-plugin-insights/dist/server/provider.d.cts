import { InsightsModel } from "./modelTypes.cjs";
import { InsightsProvider } from "./types.cjs";
//#region src/server/provider.d.ts
declare const createInsightsProvider: (model: InsightsModel) => InsightsProvider;
//#endregion
export { createInsightsProvider };