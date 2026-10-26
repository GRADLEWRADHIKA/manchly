import { DatabaseJsonObject, Platform } from "@hot-updater/plugin-core";
//#region src/server/eventRow.d.ts
/** Where an update failed, and what failed; open sets, `unknown` for any other value. */
type BundleEventFailureStage = "check" | "download" | "install" | "unknown";
type BundleEventFailureReason = "network" | "http" | "invalid_response" | "hash_mismatch" | "signature" | "patch" | "extract" | "storage" | "unknown";
/** An `UPDATE_FAILED` report's failure, as stored. */
type BundleEventFailure = DatabaseJsonObject & {
  readonly stage: BundleEventFailureStage;
  readonly reason: BundleEventFailureReason;
  /** What the client was fetching or writing. */
  readonly resource?: "catalog" | "artifact" | "manifest" | "file" | "patch" | "archive" | "unknown";
  readonly http_status?: number;
  /** How the connection failed, when it did. */
  readonly transport?: "timeout" | "dns" | "tls" | "connection" | "offline" | "cancelled" | "unknown";
  /** The storage origin's error code, such as `ExpiredToken`. */
  readonly origin_code?: string;
  readonly error_message?: string;
  readonly error_stack?: string;
};
type DatabaseHttpResponse = DatabaseJsonObject & {
  readonly resource: "catalog" | "artifact";
  readonly path: string;
  readonly status: number;
  readonly body: string | null;
  readonly body_truncated: boolean;
  readonly received_at_ms: number;
};
/** What a kept UNCHANGED row changed against its installation's head. */
type BundleEventChangeKind = "first_seen" | "bundle" | "release" | "app_version" | "channel" | "native_build";
/**
 * An UNCHANGED report the server keeps: what it changed against its
 * installation's head, and the running values the head held before it. A
 * report from an installation without a head is `first_seen` alone, with no
 * previous values: the installation is new to this server, not necessarily
 * to its device.
 */
type BundleEventChange = DatabaseJsonObject & {
  readonly kinds: BundleEventChangeKind[];
  readonly previous: (DatabaseJsonObject & {
    readonly bundle_id: string;
    readonly release_id: string | null;
    readonly app_version: string;
    readonly channel: string;
    readonly min_bundle_id?: string;
  }) | null;
};
/** Ancillary report data; queryable identity and lifecycle fields stay on the row. */
type DatabaseBundleEventMetadata = DatabaseJsonObject & {
  readonly cohort: string;
  readonly update_strategy: "fingerprint" | "appVersion" | null;
  readonly fingerprint_hash: string | null;
  readonly sdk_version: string | null;
  /** The native build's built-in bundle ID, when the SDK reports it. */
  readonly min_bundle_id?: string;
  /** `UPDATE_FAILED`: what failed. */
  readonly failure?: BundleEventFailure;
  readonly http_response?: DatabaseHttpResponse;
  /** `UPDATE_DOWNLOADED`: how the bundle arrived. */
  readonly delivery?: "patch" | "manifest" | "archive" | "unknown";
  /** `UPDATE_DOWNLOADED`: a patch failed and the full files came instead. */
  readonly patch_fallback?: boolean;
  /** A kept `UNCHANGED` row: what it changed, which the server sets. */
  readonly change?: BundleEventChange;
  /**
   * A download or apply of a target its installation already ran, as when
   * a reload cut the first runtime's report short, or a download that
   * repeats the pending one: the server keeps it in history, but it moves
   * and counts nothing.
   */
  readonly late?: true;
  /**
   * A launch or crash of a bundle whose download report never arrived: the
   * server counted that download with it.
   */
  readonly implied_download?: true;
};
type BundleEventRowBase = {
  readonly id: string;
  readonly install_id: string;
  readonly user_id: string | null;
  readonly from_release_id: string | null;
  readonly to_release_id: string | null;
  readonly to_bundle_id: string;
  readonly platform: Platform;
  readonly app_version: string;
  readonly channel: string;
  readonly metadata: DatabaseBundleEventMetadata;
  readonly received_at_ms: number;
};
type BundleEventRow = BundleEventRowBase & ({
  readonly type: "UPDATE_DOWNLOADED";
  readonly from_bundle_id: string;
} | {
  readonly type: "UPDATE_APPLIED" | "RECOVERED";
  readonly from_bundle_id: string;
} |
/** An update that failed: `from` is the running bundle, `to` the target (for a check, the running bundle). */
{
  readonly type: "UPDATE_FAILED";
  readonly from_bundle_id: string;
} | {
  readonly type: "UNCHANGED";
  readonly from_bundle_id: null;
});
//#endregion
export { BundleEventChange, BundleEventChangeKind, BundleEventFailure, BundleEventFailureReason, BundleEventFailureStage, BundleEventRow, BundleEventRowBase, DatabaseBundleEventMetadata, DatabaseHttpResponse };