import { RemoteConfigFetchResponse } from "../shared/wire.cjs";
import { RemoteConfigEvaluationContext, RemoteConfigTemplate } from "./template.cjs";
import "@hot-updater/plugin-core";
//#region src/server/api.d.ts
/** A published version's record, without its template. */
interface RemoteConfigVersion {
  readonly version: number;
  readonly description: string | null;
  /** `ROLLBACK` when the version copies `rollbackSource`. */
  readonly updateType: "PUBLISH" | "ROLLBACK";
  readonly rollbackSource: number | null;
  readonly createdAtMs: number;
}
interface RemoteConfigVersionDetail extends RemoteConfigVersion {
  readonly template: RemoteConfigTemplate;
}
/** The template devices receive now. */
interface RemoteConfigActive {
  /** 0, with an empty template, before the first publish. */
  readonly version: number;
  readonly template: RemoteConfigTemplate;
  readonly updatedAtMs: number | null;
}
/**
 * How a publish or a rollback ended: `conflict` when another publish moved
 * the active version past `baseVersion` first, so a stale edit never
 * replaces a newer template.
 */
type RemoteConfigPublishResult = {
  readonly status: "published";
  readonly version: RemoteConfigVersion;
} | {
  readonly status: "conflict";
  readonly currentVersion: number;
};
interface RemoteConfigVersionsPage {
  /** Newest first. */
  readonly versions: readonly RemoteConfigVersion[];
  /** Pass as `cursor` for the next page; absent on the last one. */
  readonly next?: string;
}
/** `hotUpdater.api.remoteConfig`. */
interface RemoteConfigApi {
  /** The active template and its version. */
  getActive(): Promise<RemoteConfigActive>;
  /**
   * Validates and publishes a template as the next version. Throws
   * `RemoteConfigValidationError` for an invalid template.
   */
  publish(input: {
    readonly template: unknown;
    /** The version the edit started from; 0 before the first publish. */
    readonly baseVersion: number;
    readonly description?: string;
  }): Promise<RemoteConfigPublishResult>;
  /** Publishes a copy of an earlier version; `not_found` when it does not exist. */
  rollback(input: {
    readonly version: number;
    readonly baseVersion: number;
    readonly description?: string;
  }): Promise<RemoteConfigPublishResult | {
    readonly status: "not_found";
  }>;
  /** One page of published versions, newest first. */
  listVersions(input?: {
    readonly limit?: number;
    readonly cursor?: string;
  }): Promise<RemoteConfigVersionsPage>;
  /** One version with its template, or null. */
  getVersion(version: number): Promise<RemoteConfigVersionDetail | null>;
  /**
   * What a device with this context receives from `GET /remote-config`, at
   * `context.now` or, without it, now.
   */
  resolve(context: RemoteConfigEvaluationContext): Promise<RemoteConfigFetchResponse>;
}
/**
 * An argument the API refuses, such as a negative `baseVersion`; the admin
 * routes answer it with `400`.
 */
declare class RemoteConfigInputError extends TypeError {
  readonly name = "RemoteConfigInputError";
}
//#endregion
export { RemoteConfigActive, RemoteConfigApi, RemoteConfigInputError, RemoteConfigPublishResult, RemoteConfigVersion, RemoteConfigVersionDetail, RemoteConfigVersionsPage };