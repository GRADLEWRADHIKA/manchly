import { ReleaseCatalogCompilation } from "./releaseCatalogCompiler.mjs";
import { ReleaseCatalogRow, ReleaseRow } from "./types/databaseRows.mjs";
import "./types/index.mjs";
//#region src/releaseCatalogMutation.d.ts
/** One Release Catalog: a channel, platform, and target kind. */
interface ReleaseCatalogScope {
  readonly channelId: string;
  readonly channelName: string;
  readonly platform: "ios" | "android";
  readonly scopeKey: string;
  readonly strategy: "APP_VERSION" | "FINGERPRINT";
  readonly fingerprintHash: string | null;
}
interface ReleaseCatalogMutationResult {
  readonly attempts: number;
  readonly catalog: ReleaseCatalogRow;
  readonly release: ReleaseRow | null;
}
declare class ReleaseCatalogMutationError extends Error {
  readonly code: "CATALOG_GENERATION_EXHAUSTED" | "CATALOG_IDENTITY_MISSING" | "INVALID_SCOPE" | "NON_MONOTONIC_RELEASE_ID" | "RELEASE_NOT_FOUND" | "VERSION_CONFLICT";
  readonly name = "ReleaseCatalogMutationError";
  constructor(code: "CATALOG_GENERATION_EXHAUSTED" | "CATALOG_IDENTITY_MISSING" | "INVALID_SCOPE" | "NON_MONOTONIC_RELEASE_ID" | "RELEASE_NOT_FOUND" | "VERSION_CONFLICT", message: string);
}
/** What a release change would write, without writing it. */
interface ReleaseCatalogMutationPreflight {
  readonly catalog: ReleaseCatalogRow;
  readonly currentCatalog: ReleaseCatalogRow | null;
  readonly diagnostics: ReleaseCatalogCompilation["diagnostics"];
  readonly expectedReleaseRevision: number | null;
  readonly release: ReleaseRow | null;
}
interface ReleaseCatalogRebuildResult {
  readonly attempts: number;
  readonly catalog: ReleaseCatalogRow;
  readonly changed: boolean;
  readonly diagnostics: ReleaseCatalogCompilation["diagnostics"];
}
interface ReleaseCatalogRebuildPreflight {
  readonly changed: boolean;
  readonly currentCatalog: ReleaseCatalogRow | null;
  readonly diagnostics: ReleaseCatalogCompilation["diagnostics"];
  readonly projectedCatalog: ReleaseCatalogRow;
}
//#endregion
export { ReleaseCatalogMutationError, ReleaseCatalogMutationPreflight, ReleaseCatalogMutationResult, ReleaseCatalogRebuildPreflight, ReleaseCatalogRebuildResult, ReleaseCatalogScope };