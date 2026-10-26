import { BundleEventFailure, BundleEventFailureReason, BundleEventFailureStage, BundleEventRow, BundleEventRowBase, DatabaseBundleEventMetadata } from "./eventRow.cjs";
import { InsightsBundleEventFilter, InsightsCountEventSeriesInput, InsightsCountEventsInput, InsightsCountLatestEventsInput, InsightsCoverage, InsightsEventCursor, InsightsEventFilter, InsightsEventSeriesPoint, InsightsFindLatestEventsInput, InsightsGetAppUsageInput, InsightsGetAppUsageResult, InsightsGetReleaseActivityInput, InsightsGetReleaseActivityResult, InsightsListEventsInput, InsightsModel, InsightsRecordEventInput, InsightsScope, InsightsTimeRange, ReleaseActivityMetrics, ReleaseReference } from "./modelTypes.cjs";
import { DEFAULT_INSIGHTS_RETENTION, InsightsRetention, InsightsSchema, createInsightsSchema, insightsSchema } from "./schema.cjs";
import { InsightsFailureBreakdown, InsightsUpdateFailures, InsightsUpdateFailuresInput } from "./reads.cjs";
import { ActiveInstallationWindow, BundleEventFailureInput, CreateBundleEventRequest, CreateBundleEventRequestBase, CursorPage, EventCursorPage, EventHistoryChange, EventHistoryRow, InsightsBundleSelection, InsightsCountMeasurement, InsightsHttpResponse, InstallationHistoryRow, InstallationRow, ReportingOverview } from "./domain.cjs";
import { InsightsEventPageInput, InsightsInstallationEventPageInput, InsightsProvider, InsightsUserInstallationPageInput } from "./types.cjs";
import { InsightsAdminReadsOptions, InsightsReads, createInsightsAdminReads, createInsightsReads } from "./adminReads.cjs";
import { InsightsBadRequestError } from "./errors.cjs";
import { createInsightsModel } from "./model.cjs";
import { createInsightsProvider } from "./provider.cjs";
import { InsightsIdentityParts, insightsIdentity } from "./recordEvent.cjs";
import { HotUpdaterDatabase, PluginEndpoint } from "@hot-updater/plugin-core";
//#region src/server/index.d.ts
declare const createInsightsApi: (db: HotUpdaterDatabase<InsightsSchema>, now: () => number, retention: InsightsRetention) => {
  /** How long this plugin keeps its rows. */
  retention: InsightsRetention;
  /** Records one validated event row; a repeated id changes nothing. */
  recordEvent: (event: BundleEventRow) => Promise<void>;
  listEvents: (input: InsightsListEventsInput) => Promise<readonly BundleEventRow[]>;
  findLatestEvents: (input: InsightsFindLatestEventsInput) => Promise<readonly BundleEventRow[]>;
  countLatestEvents: (input: InsightsCountLatestEventsInput) => Promise<number>;
  countEvents: (input: InsightsCountEventsInput) => Promise<number>;
  countEventSeries: (input: InsightsCountEventSeriesInput) => Promise<readonly InsightsEventSeriesPoint[]>;
  getReleaseActivity: (input: InsightsGetReleaseActivityInput) => Promise<InsightsGetReleaseActivityResult>;
  getAppUsage: (input: InsightsGetAppUsageInput) => Promise<InsightsGetAppUsageResult>;
  /** A release's or a channel's update failures, and their breakdown over a time range. */
  getUpdateFailures: (input: InsightsUpdateFailuresInput) => Promise<InsightsUpdateFailures>;
};
type InsightsApi = ReturnType<typeof createInsightsApi>;
interface InsightsOptions {
  /**
   * How long to keep rows, in whole days: `rawDays` (90 by default) for raw
   * events and hourly rollups, `dailyDays` (400 by default) for daily
   * rollups and each installation's latest event. Each is at least 1, and
   * `dailyDays` at least `rawDays`.
   */
  readonly retention?: Partial<InsightsRetention>;
}
/**
 * Insights: bundle lifecycle events and update failures, each
 * installation's latest event, and the counters, gauges, and sketches its
 * reads come from, each kept for its retention. It serves `POST /events` to
 * clients, and the Insights reads, update failures, and retention to admins.
 */
declare const insights: (options?: InsightsOptions) => import("@hot-updater/plugin-core").HotUpdaterPlugin<"insights", {
  readonly bundle_events: import("@hot-updater/plugin-core").TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly type: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly install_id: {
      readonly type: "string";
      readonly maxLength: 255;
    };
    readonly user_id: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly required: false;
    };
    readonly from_release_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly from_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly to_release_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly to_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly app_version: {
      readonly type: "string";
    };
    readonly channel: {
      readonly type: "string";
    };
    readonly metadata: {
      readonly type: "json";
    };
    readonly received_at_ms: {
      readonly type: "integer";
    };
  }, {
    day: "integer";
    movement_install_id: "string";
    bundle_ref: "string";
  }, {
    readonly movementsByInstall: {
      readonly eq: readonly ["movement_install_id"];
      readonly sort: readonly ["received_at_ms"];
    };
    readonly byBundle: {
      readonly eq: readonly ["platform", "channel", "type", "bundle_ref", "day"];
      readonly sort: readonly ["received_at_ms"];
    };
    readonly byDay: {
      readonly eq: readonly ["day"];
      readonly sort: readonly ["received_at_ms"];
    };
  }, readonly ["id"]>;
  readonly bundle_event_heads: import("@hot-updater/plugin-core").TableDefinition<{
    readonly install_id: {
      readonly type: "string";
      readonly maxLength: 255;
    };
    readonly id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly type: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly user_id: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly required: false;
    };
    readonly from_release_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly from_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly to_release_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
    };
    readonly to_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly app_version: {
      readonly type: "string";
    };
    readonly channel: {
      readonly type: "string";
    };
    readonly metadata: {
      readonly type: "json";
    };
    readonly received_at_ms: {
      readonly type: "integer";
    };
  }, Readonly<Record<string, import("@hot-updater/plugin-core").FieldType>>, {
    readonly byUser: {
      readonly eq: readonly ["user_id"];
      readonly sort: readonly ["install_id"];
    };
  }, readonly ["install_id"]>;
  readonly insights_overview: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "downloads" | "failed_launches" | "patch_downloads" | "patch_fallbacks", {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["identity", "bucket_start_ms"]>;
  readonly insights_sketches: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, never, {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, "activity_users" | "failed_users", readonly ["identity", "bucket_start_ms"]>;
  readonly insights_overview_daily: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "downloads" | "failed_launches" | "patch_downloads" | "patch_fallbacks", {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["identity", "bucket_start_ms"]>;
  readonly insights_sketches_daily: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, never, {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, "activity_users" | "failed_users", readonly ["identity", "bucket_start_ms"]>;
  readonly insights_overview_lifetime: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "downloads" | "failed_launches" | "patch_downloads" | "patch_fallbacks" | "applies" | "failed_updates", {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["identity", "bucket_start_ms"]>;
  readonly insights_sketches_lifetime: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly identity: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, never, {
    readonly window: {
      readonly eq: readonly ["identity"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, "failed_users", readonly ["identity", "bucket_start_ms"]>;
  readonly insights_distribution: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly channel: {
      readonly type: "string";
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly app_version: {
      readonly type: "string";
    };
    readonly release_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "latest_installations", {
    readonly byScope: {
      readonly eq: readonly ["channel", "platform"];
      readonly sort: readonly ["bucket_start_ms"];
    };
    readonly byVersion: {
      readonly eq: readonly ["channel", "platform", "app_version"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["channel", "platform", "app_version", "release_id", "bucket_start_ms"]>;
  readonly insights_builtin_distribution: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly channel: {
      readonly type: "string";
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly app_version: {
      readonly type: "string";
    };
    readonly release_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly builtin_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "latest_installations", {
    readonly byScope: {
      readonly eq: readonly ["channel", "platform"];
      readonly sort: readonly ["bucket_start_ms"];
    };
    readonly byVersion: {
      readonly eq: readonly ["channel", "platform", "app_version"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["channel", "platform", "app_version", "release_id", "builtin_bundle_id", "bucket_start_ms"]>;
  readonly insights_latest_by_bundle: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly channel: {
      readonly type: "string";
    };
    readonly bundle_field: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly type: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "installations", {
    readonly byBundle: {
      readonly eq: readonly ["platform", "channel", "bundle_field", "bundle_id", "type"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["platform", "channel", "bundle_field", "bundle_id", "type", "bucket_start_ms"]>;
  readonly insights_outcomes: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly channel: {
      readonly type: "string";
    };
    readonly type: {
      readonly type: "string";
      readonly maxLength: 32;
    };
    readonly bundle_ref: {
      readonly type: "string";
      readonly maxLength: 41;
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
  }, "events", {
    readonly byRef: {
      readonly eq: readonly ["platform", "channel", "type", "bundle_ref"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["platform", "channel", "type", "bundle_ref", "bucket_start_ms"]>;
  readonly insights_failures: import("@hot-updater/plugin-core").AggregateDefinition<{
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly channel: {
      readonly type: "string";
    };
    readonly bucket_start_ms: {
      readonly type: "integer";
    };
    readonly release_id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly stage: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly reason: {
      readonly type: "string";
      readonly maxLength: 64;
    };
    readonly detail: {
      readonly type: "string";
      readonly maxLength: 160;
    };
  }, "events", {
    readonly byScope: {
      readonly eq: readonly ["platform", "channel"];
      readonly sort: readonly ["bucket_start_ms"];
    };
  }, never, readonly ["platform", "channel", "bucket_start_ms", "release_id", "stage", "reason", "detail"]>;
}, {
  api: {
    /** How long this plugin keeps its rows. */
    retention: InsightsRetention;
    /** Records one validated event row; a repeated id changes nothing. */
    recordEvent: (event: BundleEventRow) => Promise<void>;
    listEvents: (input: InsightsListEventsInput) => Promise<readonly BundleEventRow[]>;
    findLatestEvents: (input: InsightsFindLatestEventsInput) => Promise<readonly BundleEventRow[]>;
    countLatestEvents: (input: InsightsCountLatestEventsInput) => Promise<number>;
    countEvents: (input: InsightsCountEventsInput) => Promise<number>;
    countEventSeries: (input: InsightsCountEventSeriesInput) => Promise<readonly InsightsEventSeriesPoint[]>;
    getReleaseActivity: (input: InsightsGetReleaseActivityInput) => Promise<InsightsGetReleaseActivityResult>;
    getAppUsage: (input: InsightsGetAppUsageInput) => Promise<InsightsGetAppUsageResult>;
    /** A release's or a channel's update failures, and their breakdown over a time range. */
    getUpdateFailures: (input: InsightsUpdateFailuresInput) => Promise<InsightsUpdateFailures>;
  };
  endpoints: PluginEndpoint[];
}, {}>;
//#endregion
export { type ActiveInstallationWindow, type BundleEventFailure, type BundleEventFailureInput, type BundleEventFailureReason, type BundleEventFailureStage, type BundleEventRow, type BundleEventRowBase, type CreateBundleEventRequest, type CreateBundleEventRequestBase, type CursorPage, DEFAULT_INSIGHTS_RETENTION, type DatabaseBundleEventMetadata, type EventCursorPage, type EventHistoryChange, type EventHistoryRow, type InsightsAdminReadsOptions, InsightsApi, InsightsBadRequestError, type InsightsBundleEventFilter, type InsightsBundleSelection, type InsightsCountEventSeriesInput, type InsightsCountEventsInput, type InsightsCountLatestEventsInput, type InsightsCountMeasurement, type InsightsCoverage, type InsightsEventCursor, type InsightsEventFilter, type InsightsEventPageInput, type InsightsEventSeriesPoint, type InsightsFailureBreakdown, type InsightsFindLatestEventsInput, type InsightsGetAppUsageInput, type InsightsGetAppUsageResult, type InsightsGetReleaseActivityInput, type InsightsGetReleaseActivityResult, type InsightsHttpResponse, type InsightsIdentityParts, type InsightsInstallationEventPageInput, type InsightsListEventsInput, type InsightsModel, InsightsOptions, type InsightsProvider, type InsightsReads, type InsightsRecordEventInput, type InsightsRetention, type InsightsSchema, type InsightsScope, type InsightsTimeRange, type InsightsUpdateFailures, type InsightsUpdateFailuresInput, type InsightsUserInstallationPageInput, type InstallationHistoryRow, type InstallationRow, type ReleaseActivityMetrics, type ReleaseReference, type ReportingOverview, createInsightsAdminReads, createInsightsModel, createInsightsProvider, createInsightsReads, createInsightsSchema, insights, insightsIdentity, insightsSchema };