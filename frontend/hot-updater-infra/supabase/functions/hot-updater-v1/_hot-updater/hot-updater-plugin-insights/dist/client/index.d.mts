import { HotUpdaterClientPlugin } from "@hot-updater/protocol";
//#region src/client/index.d.ts
interface InsightsOptions {
  /**
   * Also report from debug builds (`__DEV__`). Defaults to `false`, so
   * development sessions stay out of production Insights.
   */
  readonly debug?: boolean;
}
/** The app's own id for the signed-in user, attached to later reports. */
interface InsightsUser {
  readonly userId: string | number;
}
/** Insights on the instance `HotUpdater.init` returns, as `hotUpdater.insights`. */
interface InsightsClient {
  /**
   * Attaches the signed-in user's id to later reports, or clears it with
   * `null`. It persists on the device and sends nothing by itself.
   */
  setUser(user: InsightsUser | null): void;
}
/** The `insights()` plugin: it adds `hotUpdater.insights`. */
type InsightsPlugin = HotUpdaterClientPlugin<"insights", InsightsClient>;
/**
 * Reports update adoption to a server that runs the `insights()` server
 * plugin: launches (at most once a UTC day while nothing changes), downloads,
 * applies, recoveries, and update failures. After the server answers that
 * Insights is off, the plugin sends nothing for 24 hours, and for the rest
 * of that runtime.
 *
 * @example
 * ```ts
 * import { HotUpdater, insights } from "@hot-updater/react-native";
 *
 * export const hotUpdater = HotUpdater.init({ baseURL, plugins: [insights()] });
 * hotUpdater.insights.setUser({ userId: "user-123" });
 * ```
 */
declare const insights: (options?: InsightsOptions) => InsightsPlugin;
//#endregion
export { InsightsClient, InsightsOptions, InsightsPlugin, InsightsUser, insights };