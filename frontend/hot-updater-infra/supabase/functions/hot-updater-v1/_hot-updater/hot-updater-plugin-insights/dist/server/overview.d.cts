import "./eventRow.cjs";
//#region src/server/overview.d.ts
type InsightsOverviewIdentity = {
  readonly scopeKind: "release" | "channel" | "usage";
  readonly releaseKind: "all" | "specific";
  readonly releaseId: string;
  readonly channel: string;
  readonly platform: "all" | "ios" | "android";
  readonly appVersionKind: "all" | "specific";
  readonly appVersion: string;
  readonly periodKind: "lifetime" | "hour";
  readonly bucketStartMs: number;
};
//#endregion
export { InsightsOverviewIdentity };