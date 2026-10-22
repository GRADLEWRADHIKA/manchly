import "./eventRow.mjs";
import { InsightsCoverage, InsightsTimeRange } from "./modelTypes.mjs";
import { HotUpdaterDatabase } from "@hot-updater/plugin-core";
//#region src/server/reads.d.ts
interface InsightsUpdateFailuresInput {
  readonly platform: "ios" | "android";
  readonly channel: string;
  /** A release's failures; without it, the channel's, which need a time range. */
  readonly releaseId?: string;
  /** Without it, a release's failures since its first report. */
  readonly timeRange?: InsightsTimeRange;
}
/** Update failures of one stage and reason, and what else their clients knew. */
interface InsightsFailureBreakdown {
  readonly stage: string;
  readonly reason: string;
  readonly events: number;
  /** By resource, HTTP status, origin code, and transport, most first. */
  readonly details: readonly {
    readonly resource: string | null;
    readonly httpStatus: number | null;
    readonly originCode: string | null;
    readonly transport: string | null;
    readonly events: number;
  }[];
}
interface InsightsUpdateFailures {
  readonly coverage: InsightsCoverage;
  readonly measuredAtMs: number;
  /** Update failures other than failed checks: each client reports one at most once a UTC day. */
  readonly failedUpdates: number;
  /** Installations with such a failure, estimated. */
  readonly failedInstallations: number;
  /** Download reports: each installation reports a bundle's download once. */
  readonly downloads: number;
  /** Downloads a patch delivered, and those that fell back from a patch to files or the archive. */
  readonly patchDownloads: number;
  readonly patchFallbacks: number;
  /** A channel's failed update checks, installations with one, and its active installations, estimated. */
  readonly checks?: {
    readonly failures: number;
    readonly failedInstallations: number;
    readonly activeInstallations: number;
  };
  /** Over a time range: failures by stage and reason, most first. */
  readonly breakdown?: readonly InsightsFailureBreakdown[];
}
//#endregion
export { InsightsFailureBreakdown, InsightsUpdateFailures, InsightsUpdateFailuresInput };