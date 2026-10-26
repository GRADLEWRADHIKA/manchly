import "./eventRow.mjs";
import { InsightsOverviewIdentity } from "./overview.mjs";
import { HotUpdaterDatabase } from "@hot-updater/plugin-core";
//#region src/server/recordEvent.d.ts
/**
 * An overview or sketch row's scope and period; day periods roll up channel
 * and usage rows. The `failure` and `check` scopes key the sketches of
 * installations whose update, or whose update check, failed.
 */
type InsightsIdentityParts = Omit<InsightsOverviewIdentity, "bucketStartMs" | "periodKind" | "scopeKind"> & {
  readonly scopeKind: InsightsOverviewIdentity["scopeKind"] | "failure" | "check";
  readonly periodKind: InsightsOverviewIdentity["periodKind"] | "day";
};
/** The `identity` of an overview or sketch row: its scope and period, hashed. */
declare const insightsIdentity: (identity: InsightsIdentityParts) => string;
//#endregion
export { InsightsIdentityParts, insightsIdentity };