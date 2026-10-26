import { RELEASE_CATALOG_FALLBACK_POLICY, RELEASE_CATALOG_SCHEMA_VERSION, Release, ReleaseCatalogDescriptor, ReleaseStrategy, canonicalizeAppVersion } from "@hot-updater/protocol";
//#region src/releaseCatalogCompiler.d.ts
interface CatalogVersionBound {
  readonly version: string;
  readonly inclusive: boolean;
}
interface CompiledCatalogSegment {
  readonly lower: CatalogVersionBound | null;
  readonly upper: CatalogVersionBound | null;
  readonly releaseIndexes: readonly number[];
  readonly rollbackReleaseIndexes: readonly number[];
}
type CompiledReleaseCatalog = {
  readonly schemaVersion: typeof RELEASE_CATALOG_SCHEMA_VERSION;
  readonly strategy: "APP_VERSION";
  readonly fallbackPolicy: typeof RELEASE_CATALOG_FALLBACK_POLICY;
  readonly releaseDescriptors: readonly ReleaseCatalogDescriptor[];
  readonly segments: readonly CompiledCatalogSegment[];
} | {
  readonly schemaVersion: typeof RELEASE_CATALOG_SCHEMA_VERSION;
  readonly strategy: "FINGERPRINT";
  readonly fallbackPolicy: typeof RELEASE_CATALOG_FALLBACK_POLICY;
  readonly releaseDescriptors: readonly ReleaseCatalogDescriptor[];
  readonly releaseIndexes: readonly number[];
  readonly rollbackReleaseIndexes: readonly number[];
};
interface ReleaseCatalogCompilerDiagnostics {
  readonly releaseCount: number;
  readonly descriptorCount: number;
  readonly segmentCount: number;
  readonly distinctTargetCohortCount: number;
  readonly byteSize: number;
}
interface ReleaseCatalogCompilation {
  readonly payload: CompiledReleaseCatalog;
  readonly canonicalPayload: string;
  readonly catalogHash: string;
  readonly byteSize: number;
  readonly diagnostics: ReleaseCatalogCompilerDiagnostics;
}
declare class ReleaseCatalogCompilationError extends Error {
  readonly code: "INVALID_RELEASE" | "INVALID_TARGET_RANGE" | "TARGET_COHORT_LIMIT" | "DISTINCT_TARGET_COHORT_LIMIT" | "CATALOG_OVERSIZE";
  constructor(code: "INVALID_RELEASE" | "INVALID_TARGET_RANGE" | "TARGET_COHORT_LIMIT" | "DISTINCT_TARGET_COHORT_LIMIT" | "CATALOG_OVERSIZE", message: string);
}
declare function compileReleaseCatalog(input: {
  readonly strategy: ReleaseStrategy;
  readonly releases: readonly Release[];
}): Promise<ReleaseCatalogCompilation>;
declare function projectCompiledCatalog(catalog: CompiledReleaseCatalog, appVersion?: string): readonly ReleaseCatalogDescriptor[];
declare function projectCompiledRollbackCatalog(catalog: CompiledReleaseCatalog, appVersion?: string): readonly ReleaseCatalogDescriptor[];
declare function referenceCompatibleReleases(releases: readonly Release[], appVersion: string): readonly Release[];
//#endregion
export { CatalogVersionBound, CompiledCatalogSegment, CompiledReleaseCatalog, ReleaseCatalogCompilation, ReleaseCatalogCompilationError, ReleaseCatalogCompilerDiagnostics, canonicalizeAppVersion, compileReleaseCatalog, projectCompiledCatalog, projectCompiledRollbackCatalog, referenceCompatibleReleases };