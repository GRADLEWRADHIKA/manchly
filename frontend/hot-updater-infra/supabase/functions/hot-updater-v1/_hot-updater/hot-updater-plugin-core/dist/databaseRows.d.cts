import { BundlePatchRow, BundleRow, ReleaseRow } from "./types/databaseRows.cjs";
import "./types/index.cjs";
import { Bundle, Release } from "@hot-updater/protocol";
//#region src/databaseRows.d.ts
declare const releaseToRow: (release: Release, scopeKey: string) => ReleaseRow;
declare const releaseRowToRelease: (row: ReleaseRow) => Release;
declare const BundleRowHydrationErrorReason: {
  readonly duplicatePatchId: "duplicate_patch_id";
  readonly orphanPatchOwner: "orphan_patch_owner";
  readonly orphanPatchBase: "orphan_patch_base";
};
type BundleRowHydrationErrorReason = (typeof BundleRowHydrationErrorReason)[keyof typeof BundleRowHydrationErrorReason];
type BundleRowHydrationErrorInput = {
  readonly reason: BundleRowHydrationErrorReason;
  readonly patchId: string;
  readonly bundleId: string;
};
declare class BundleRowHydrationError extends Error {
  readonly name = "BundleRowHydrationError";
  readonly reason: BundleRowHydrationErrorReason;
  readonly patchId: string;
  readonly bundleId: string;
  constructor({ reason, patchId, bundleId }: BundleRowHydrationErrorInput);
}
declare const bundleToRow: (bundle: Bundle) => BundleRow;
declare const bundleToPatchRows: (bundle: Bundle) => BundlePatchRow[];
declare const rowToBundle: (row: BundleRow, patchRows?: readonly BundlePatchRow[]) => Bundle;
declare const rowsToBundles: (bundleRows: readonly BundleRow[], patchRows: readonly BundlePatchRow[], referencedBundleRows: readonly BundleRow[]) => Bundle[];
//#endregion
export { BundleRowHydrationError, BundleRowHydrationErrorReason, bundleToPatchRows, bundleToRow, releaseRowToRelease, releaseToRow, rowToBundle, rowsToBundles };