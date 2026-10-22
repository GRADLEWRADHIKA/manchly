import { ReleaseCatalogMutationResult } from "./releaseCatalogMutation.mjs";
//#region src/releaseManagement.d.ts
/** The release fields a policy change may set. */
interface ReleasePolicyPatch {
  readonly enabled?: boolean;
  readonly fingerprintHash?: string;
  readonly message?: string | null;
  readonly rolloutCohortCount?: number;
  readonly shouldForceUpdate?: boolean;
  readonly targetAppVersion?: string;
  readonly targetCohorts?: readonly string[];
}
declare class ReleaseManagementError extends Error {
  readonly code: "ENABLED_RELEASE" | "RELEASE_NOT_FOUND" | "SCOPE_MOVE_UNSUPPORTED" | "TARGET_RELEASE_INVALID" | "VERSION_CONFLICT";
  readonly name = "ReleaseManagementError";
  constructor(code: "ENABLED_RELEASE" | "RELEASE_NOT_FOUND" | "SCOPE_MOVE_UNSUPPORTED" | "TARGET_RELEASE_INVALID" | "VERSION_CONFLICT", message: string);
}
interface PromoteReleaseResult {
  /** The source release after a move, or null for a copy. */
  readonly source: ReleaseCatalogMutationResult | null;
  readonly target: ReleaseCatalogMutationResult;
}
//#endregion
export { PromoteReleaseResult, ReleaseManagementError, ReleasePolicyPatch };