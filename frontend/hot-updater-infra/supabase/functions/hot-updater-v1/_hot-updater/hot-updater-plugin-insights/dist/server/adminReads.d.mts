import { InsightsRetention } from "./schema.mjs";
import { InsightsUpdateFailures, InsightsUpdateFailuresInput } from "./reads.mjs";
import { InsightsProvider } from "./types.mjs";
import { InsightsApi } from "./index.mjs";
import { RemoteDatabase } from "@hot-updater/plugin-core";
//#region src/server/adminReads.d.ts
/**
 * The Insights reads tooling shows, the Console and the CLI: the routes'
 * reads, update failures, and how long rows are kept.
 */
type InsightsReads = Omit<InsightsProvider, "appendBundleEvent"> & {
  getRetention(): Promise<InsightsRetention>;
  getUpdateFailures(input: InsightsUpdateFailuresInput): Promise<InsightsUpdateFailures>;
};
/** The reads over the `insights()` API tooling assembled on the server's database. */
declare const createInsightsReads: (api: InsightsApi) => InsightsReads;
interface InsightsAdminReadsOptions {
  /**
   * The error for a server that runs without `insights()`, whose admin API
   * answers its routes with 404.
   */
  readonly unavailable?: () => Error;
}
/**
 * The reads over a self-hosted server's admin routes, which its `insights()`
 * serves, for tooling that reaches it through `standaloneRepository`.
 */
declare const createInsightsAdminReads: (fetchAdmin: RemoteDatabase["fetchAdmin"], { unavailable }?: InsightsAdminReadsOptions) => InsightsReads;
//#endregion
export { InsightsAdminReadsOptions, InsightsReads, createInsightsAdminReads, createInsightsReads };