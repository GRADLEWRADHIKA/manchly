import { InsightsScope } from "./modelTypes.mjs";
import { ActiveInstallationWindow, CreateBundleEventRequest, CursorPage, EventCursorPage, EventHistoryRow, InsightsBundleSelection, InstallationHistoryRow, InstallationRow, ReportingOverview } from "./domain.mjs";
//#region src/server/types.d.ts
type InsightsEventPageInput = {
  readonly beforeReceivedAtMs?: number;
  readonly sinceMs?: number;
  readonly bundle?: InsightsBundleSelection;
  readonly cursor?: string;
  readonly limit?: number;
};
type InsightsInstallationEventPageInput = Omit<InsightsEventPageInput, "bundle"> & {
  readonly installId: string;
};
type InsightsUserInstallationPageInput = {
  readonly userId: string;
  readonly cursor?: string;
  readonly limit?: number;
};
type InsightsProvider = {
  appendBundleEvent(input: CreateBundleEventRequest): Promise<void>;
  listEvents(input: InsightsEventPageInput): Promise<EventCursorPage<EventHistoryRow>>;
  listInstallationEvents(input: InsightsInstallationEventPageInput): Promise<EventCursorPage<InstallationHistoryRow>>;
  getInstallation(input: {
    readonly installId: string;
  }): Promise<InstallationRow | null>;
  pageInstallationsByCurrentUserId(input: InsightsUserInstallationPageInput): Promise<CursorPage<InstallationRow>>;
  getReportingOverview(input: InsightsScope & {
    readonly window: ActiveInstallationWindow;
    readonly bundleId?: string;
  }): Promise<ReportingOverview>;
};
//#endregion
export { InsightsEventPageInput, InsightsInstallationEventPageInput, InsightsProvider, InsightsUserInstallationPageInput };