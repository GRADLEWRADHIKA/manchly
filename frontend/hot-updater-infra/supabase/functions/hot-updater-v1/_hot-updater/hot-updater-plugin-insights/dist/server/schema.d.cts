//#region src/server/schema.d.ts
/** How long Insights keeps its rows, in whole days. Lifetime counters are kept. */
interface InsightsRetention {
  /** Raw events and hourly rollups. */
  readonly rawDays: number;
  /** Daily rollups, and each installation's latest event and the gauges that count it. */
  readonly dailyDays: number;
}
declare const DEFAULT_INSIGHTS_RETENTION: InsightsRetention;
/**
 * Insights' tables, each expiring after its period. The periods are values
 * the engine applies at runtime; the tables and indexes are the same for
 * any periods.
 */
declare const createInsightsSchema: ({ rawDays, dailyDays }?: InsightsRetention) => {
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
    /** Events of every scope by day, for the console's unfiltered event list. */
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
  /** Hourly counters and sketches: the raw period. */
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
  /** Daily counters and sketches: the daily period. */
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
  /** A release's counters since its first event, and its failed installations: kept. */
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
};
declare const insightsSchema: {
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
    /** Events of every scope by day, for the console's unfiltered event list. */
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
  /** Hourly counters and sketches: the raw period. */
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
  /** Daily counters and sketches: the daily period. */
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
  /** A release's counters since its first event, and its failed installations: kept. */
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
};
type InsightsSchema = typeof insightsSchema;
//#endregion
export { DEFAULT_INSIGHTS_RETENTION, InsightsRetention, InsightsSchema, createInsightsSchema, insightsSchema };