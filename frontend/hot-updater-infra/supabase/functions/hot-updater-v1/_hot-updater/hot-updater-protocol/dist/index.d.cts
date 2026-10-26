//#region src/appVersion.d.ts
/**
 * The form of an app version that the device and the server compare:
 * `major.minor.patch` of the first version in `appVersion`, such as `1.4.0`
 * for `v1.4`, or null when it holds none. Prerelease and build parts are
 * dropped.
 */
declare function canonicalizeAppVersion(appVersion: string): string | null;
//#endregion
//#region src/baseURL.d.ts
/** The server's base URL, or a function that returns it, as the SDK takes it. */
type HotUpdaterBaseURL = string | (() => string | Promise<string>);
/** Resolves a functional baseURL and drops trailing slashes. */
declare const resolveBaseURL: (baseURL: HotUpdaterBaseURL) => Promise<string>;
//#endregion
//#region src/types.d.ts
type Platform = "ios" | "android";
type BundleMetadata = {
  app_version?: string;
};
interface BundlePatchArtifact {
  baseBundleId: string;
  baseFileHash: string;
  byteSize: number;
  patchFileHash: string;
  patchStorageUri: string;
}
interface ChangedAssetPatch {
  algorithm: "bsdiff";
  baseBundleId: string;
  baseFileHash: string;
  patchFileHash: string;
  patchUrl: string;
  /** Transferred patch bytes, used as a conservative installation cost hint. */
  byteSize?: number;
}
/** Authenticated by the target manifest; always describes bundle.tar.br. */
interface ManifestArchive {
  downloadFileHash: string;
  downloadByteSize: number;
  tarByteSize: number;
}
interface ArtifactAssetFile {
  compression?: "br" | null;
  url: string;
}
interface ArtifactAsset {
  file: ArtifactAssetFile;
  fileHash: string;
  patch?: ChangedAssetPatch | null;
}
declare const ARTIFACT_PROTOCOL_VERSION: 1;
/**
 * Artifact protocol in which a device asks for the URLs of only the files it
 * downloads one by one, after reusing local files and choosing the archive.
 */
declare const ARTIFACT_FILES_PROTOCOL_VERSION: 2;
/** Paths one artifact files request may resolve; a device splits more. */
declare const ARTIFACT_FILES_REQUEST_LIMIT = 100;
interface Bundle {
  /**
   * The unique identifier for the bundle. uuidv7
   */
  id: string;
  /**
   * The platform the bundle is for.
   */
  platform: Platform;
  /**
   * The git commit hash of the bundle.
   */
  gitCommitHash: string | null;
  /**
   * The metadata of the bundle.
   */
  metadata?: BundleMetadata;
  /**
   * Storage URI for the bundle manifest artifact.
   */
  manifestStorageUri: string;
  /**
   * SHA256 hash of the manifest artifact, optionally signed as sig:<signature>.
   */
  manifestFileHash: string;
  /**
   * Storage URI prefix for manifest assets.
   */
  assetBaseStorageUri: string;
  /**
   * Binary patch artifacts keyed by base bundle in array order.
   * Earlier entries take precedence when a single "primary" patch is needed.
   */
  patches?: BundlePatchArtifact[] | null;
}
type UpdateStatus = "ROLLBACK" | "UPDATE";
interface ArtifactInfo {
  /** Manifest artifact protocol used by current native clients. */
  artifactProtocolVersion: typeof ARTIFACT_PROTOCOL_VERSION;
  /**
   * Manifest artifact for protocol v1 updates.
   */
  manifestUrl: string;
  /**
   * SHA256 hash of the manifest file, optionally with embedded signature.
   * Uses `sig:<base64_signature>` or a plain SHA256 hash.
   */
  manifestFileHash: string;
  /** Optional bulk transport. Hash and sizes come from the verified manifest. */
  archiveUrl?: string;
  /**
   * Full target manifest file map. Protocol v1 requires one original file
   * descriptor for every target asset; patches are optional optimizations.
   */
  assets: Record<string, ArtifactAsset>;
}
/**
 * How a device downloads a Bundle in artifact protocol v2: no URL per file,
 * so the response and its signing stay the same size for any number of files.
 */
interface ArtifactInfoV2 {
  artifactProtocolVersion: typeof ARTIFACT_FILES_PROTOCOL_VERSION;
  manifestUrl: string;
  /** SHA256 hash of the manifest file, optionally `sig:<base64_signature>`. */
  manifestFileHash: string;
  /** Optional bulk transport. Hash and sizes come from the verified manifest. */
  archiveUrl?: string;
  /** The Hermes bytecode patch from the device's current Bundle, if smaller than its file. */
  patch?: ChangedAssetPatch & {
    assetPath: string;
  };
}
/** The request body of `POST /artifacts/v2/:bundleId/files`. */
interface ArtifactFilesRequest {
  /** Manifest asset paths, unique, at most {@link ARTIFACT_FILES_REQUEST_LIMIT}. */
  paths: string[];
}
/** Download URLs for the requested manifest asset paths. */
interface ArtifactFiles {
  files: Record<string, ArtifactAssetFile>;
}
//#endregion
//#region src/bundleArtifacts.d.ts
declare const getManifestStorageUri: (bundle: Pick<Bundle, "manifestStorageUri">) => string;
declare const getManifestFileHash: (bundle: Pick<Bundle, "manifestFileHash">) => string;
declare const getAssetBaseStorageUri: (bundle: Pick<Bundle, "assetBaseStorageUri">) => string;
declare const getBundlePatches: (bundle: Pick<Bundle, "patches">) => BundlePatchArtifact[];
declare const getBundlePatch: (bundle: Pick<Bundle, "patches">, baseBundleId: string) => BundlePatchArtifact | null;
declare const getPatchBaseBundleId: (bundle: Pick<Bundle, "patches">) => string;
declare const getPatchBaseFileHash: (bundle: Pick<Bundle, "patches">) => string;
declare const getPatchFileHash: (bundle: Pick<Bundle, "patches">) => string;
declare const getPatchStorageUri: (bundle: Pick<Bundle, "patches">) => string;
//#endregion
//#region src/clientPlugin.d.ts
/**
 * The client plugin contract. Built-in plugins, such as Insights, and
 * third-party plugins use the same one, as server plugins do. Plugins import
 * it from here, and apps through `@hot-updater/react-native`.
 *
 * Keep this module free of state and of classes that code checks with
 * `instanceof`. A plugin can load it in one module format while the app loads
 * it in the other, so two copies can run side by side.
 */
type UpdateStrategy = "fingerprint" | "appVersion";
/** How an update moves the app's selection. */
type ReleaseTransitionKind = "INSTALL" | "ADOPT_RELEASE" | "USE_BUILTIN";
/** The launch outcome native reports once per JavaScript runtime. */
type AppReadyResult = {
  /** No update was applied or recovered at this launch. */
  readonly status: "UNCHANGED";
  readonly channel: string;
  /** The running bundle. */
  readonly bundleId: string;
  /** The Release the running bundle was selected as, when known. */
  readonly releaseId: string | null;
} | {
  /**
   * `UPDATE_APPLIED`: a staged update became active at this launch.
   * `RECOVERED`: a failed update was rolled back to `toBundleId`.
   */
  readonly status: "UPDATE_APPLIED" | "RECOVERED";
  readonly channel: string;
  readonly fromBundleId: string;
  readonly fromReleaseId: string | null;
  readonly toBundleId: string;
  readonly toReleaseId: string | null;
  readonly updateStrategy: UpdateStrategy;
};
/** What an update check found. */
type UpdateCheckResult = {
  /**
   * The app keeps running its bundle: the check found nothing to
   * install, or the app adopted a newer Release of the running bundle.
   */
  readonly status: "UNCHANGED";
  readonly channel: string;
  readonly bundleId: string;
  /** The Release the running bundle is selected as after the check. */
  readonly releaseId: string | null;
  /** The Release before the check; it differs after an adoption. */
  readonly previousReleaseId: string | null;
  /**
   * When the event happened, in epoch milliseconds, for an event native
   * code recorded before this runtime started (a native
   * `HotUpdaterInstance`). Absent when the event happens now.
   */
  readonly occurredAt?: number;
} | {
  /** The check found a Release to install, adopt, or roll back to. */
  readonly status: "UPDATE_AVAILABLE";
  readonly channel: string;
  readonly fromBundleId: string;
  readonly fromReleaseId: string | null;
  readonly toBundleId: string;
  readonly toReleaseId: string | null;
  readonly transitionKind: ReleaseTransitionKind;
  readonly updateStatus: "UPDATE" | "ROLLBACK";
  readonly shouldForceUpdate: boolean;
  readonly updateStrategy: UpdateStrategy;
  /**
   * When the event happened, in epoch milliseconds, for an event native
   * code recorded before this runtime started (a native
   * `HotUpdaterInstance`). Absent when the event happens now.
   */
  readonly occurredAt?: number;
};
/** A bundle the SDK downloaded, verified, and staged for the next launch. */
interface BundleDownloadedInfo {
  readonly channel: string;
  readonly fromBundleId: string;
  readonly fromReleaseId: string | null;
  readonly toBundleId: string;
  readonly toReleaseId: string | null;
  readonly updateStrategy: UpdateStrategy;
  /**
   * How the bundle arrived: `patch` when a bsdiff patch produced a file,
   * `manifest` when only the changed files were downloaded, `archive` for
   * the full archive.
   */
  readonly delivery: "patch" | "manifest" | "archive";
  /** A patch was tried, but the file or the archive was downloaded instead. */
  readonly patchFallback: boolean;
  /**
   * When the event happened, in epoch milliseconds, for an event native code
   * recorded before this runtime started (a native `HotUpdaterInstance`).
   * Absent when the event happens now.
   */
  readonly occurredAt?: number;
}
/**
 * Where an update failed: `check` covers the Release catalog request,
 * `download` the transfer and verification of the update's files, and
 * `install` patching, extracting, and moving them into place.
 */
type UpdateErrorStage = "check" | "download" | "install";
/** What the SDK was fetching or applying when an update failed. */
type UpdateErrorResource = "catalog" | "artifact" | "manifest" | "file" | "patch" | "archive";
/** Why no response arrived, for a `network` failure. */
type UpdateErrorTransport = "timeout" | "dns" | "tls" | "connection" | "offline" | "cancelled";
type UpdateErrorReason = "network" | "http" | "invalid_response" | "hash_mismatch" | "signature" | "patch" | "extract" | "storage" | "unknown";
/** An update check, download, or install that failed. */
interface UpdateError {
  readonly stage: UpdateErrorStage;
  readonly reason: UpdateErrorReason;
  /** What was being fetched or applied, when the SDK knows. */
  readonly resource?: UpdateErrorResource;
  /** The response status when `reason` is `"http"`. */
  readonly httpStatus?: number;
  /**
   * The storage origin's XML error `<Code>`, such as `AccessDenied`,
   * `NoSuchKey`, or `ExpiredToken`, when an `http` failure's body names one.
   * It tells an expired signed URL from a missing file.
   */
  readonly originCode?: string;
  /** Why no response arrived, for a `network` failure, when the SDK knows. */
  readonly transport?: UpdateErrorTransport;
  /** The bundle the update targeted; absent for the check stage. */
  readonly targetBundleId?: string;
  /** The Release the update targeted, when it names one. */
  readonly targetReleaseId?: string;
  readonly channel: string;
  /** The running bundle and the Release it was selected as. */
  readonly bundleId: string;
  readonly releaseId: string | null;
  readonly updateStrategy: UpdateStrategy;
  /** The error the SDK caught. */
  readonly cause: unknown;
  /**
   * When the event happened, in epoch milliseconds, for an event native code
   * recorded before this runtime started (a native `HotUpdaterInstance`).
   * Absent when the event happens now.
   */
  readonly occurredAt?: number;
}
/** A response from the update server's catalog or artifact API. */
interface UpdateHttpResponse {
  readonly resource: "catalog" | "artifact";
  /**
   * The channel the request checked, for a response native code received before
   * this runtime started (a native `HotUpdaterInstance`). Absent when the
   * response belongs to the current channel.
   */
  readonly channel?: string;
  /** Request path only; authentication headers and query parameters are omitted. */
  readonly path: string;
  readonly status: number;
  /** The response as text, or null if the body could not be read. */
  readonly body: string | null;
  readonly bodyTruncated: boolean;
  /**
   * When the response arrived, in epoch milliseconds, for a response native
   * code received before this runtime started (a native `HotUpdaterInstance`).
   * Absent when it arrives now.
   */
  readonly occurredAt?: number;
}
/**
 * Lifecycle hooks a plugin returns from `setup` as `hooks`. Hooks observe:
 * the SDK never waits for one and ignores what it returns, and a hook that
 * throws or rejects is reported through `onError`, or a console warning
 * without one, so a plugin can never delay or change an update.
 */
interface HotUpdaterClientHooks {
  /** Called once per JavaScript runtime, after native reports the launch. */
  onAppReady?(result: AppReadyResult): void | Promise<void>;
  /** Called after each update check, and after a Release adoption commits. */
  onUpdateCheck?(result: UpdateCheckResult): void | Promise<void>;
  /** Called after the SDK stages a downloaded bundle. */
  onBundleDownloaded?(info: BundleDownloadedInfo): void | Promise<void>;
  /** Called when an update check, download, or install fails. */
  onUpdateError?(error: UpdateError): void | Promise<void>;
  /** Called for every catalog/artifact API response, including 200 and 304. */
  onHttpResponse?(response: UpdateHttpResponse): void | Promise<void>;
}
/**
 * A plugin's persistent key-value store. Native keeps it on the device,
 * outside device backups, and the SDK scopes its keys to the plugin's id.
 * It is meant for small values, up to 64 KB each.
 */
interface HotUpdaterClientStorage {
  get(key: string): string | null;
  /** Writes the value; `null` removes the key. */
  set(key: string, value: string | null): void;
}
interface HotUpdaterClientContext {
  /**
   * Requests a path relative to the configured `baseURL`, with the SDK's
   * `requestHeaders` and `requestTimeout` applied. Rejects with
   * `Request timed out` when the timeout passes before a response arrives.
   */
  fetch(path: string, init?: RequestInit): Promise<Response>;
  /** A random id native creates once per installation. */
  readonly installId: string;
  readonly platform: "ios" | "android";
  /** The native app version, or null when the native build has none. */
  readonly appVersion: string | null;
  readonly sdkVersion: string;
  /**
   * The bundle ID of the bundle the native build ships (`MIN_BUNDLE_ID`).
   * `getBundleId()` returns it while the app runs that built-in bundle.
   */
  readonly minBundleId: string;
  /** Whether this is a debug build (`__DEV__`). */
  readonly isDebugBuild: boolean;
  /** The bundle native reports as current. */
  getBundleId(): string;
  getChannel(): string;
  getCohort(): string;
  getFingerprintHash(): string | null;
  readonly storage: HotUpdaterClientStorage;
  /** The current time in milliseconds since the epoch. */
  now(): number;
}
/**
 * What a plugin's `setup` returns: the hooks it observes the SDK with, and
 * the API `HotUpdater.init` puts on the instance it returns, under the
 * plugin's id, as `hotUpdater.<id>`.
 */
interface HotUpdaterClientSetup<TApi = unknown> {
  readonly hooks?: HotUpdaterClientHooks;
  readonly api?: TApi;
}
/**
 * A client plugin with the id `TId` and the API `TApi` it adds to the
 * instance `HotUpdater.init` returns.
 */
interface HotUpdaterClientPlugin<TId extends string = string, TApi = unknown> {
  /**
   * Unique among an app's plugins; two plugins with one id throw at init.
   * It names the plugin's API on the instance, so it cannot be the name of
   * one of the instance's own methods.
   */
  readonly id: TId;
  /**
   * Called once for each plugin host it is configured in. The React Native
   * SDK creates a host for each instance `HotUpdater.init` returns.
   */
  setup(context: HotUpdaterClientContext): HotUpdaterClientSetup<TApi> | void;
}
type SetupResult<P> = P extends {
  setup(context: HotUpdaterClientContext): infer R;
} ? Exclude<R, void | undefined> : never;
/** The API a plugin's `setup` returns, or `never` for a plugin without one. */
type ClientPluginApi<P> = "api" extends keyof SetupResult<P> ? Exclude<SetupResult<P>["api" & keyof SetupResult<P>], undefined> : never;
/** The plugins' APIs by plugin id, as the instance `HotUpdater.init` returns has them. */
type ClientPluginApis<TPlugins extends readonly HotUpdaterClientPlugin[]> = { readonly [P in TPlugins[number] as [ClientPluginApi<P>] extends [never] ? never : P["id"]]: ClientPluginApi<P>; };
/** Declares a client plugin; built-in and third-party plugins use the same contract. */
declare const defineClientPlugin: <const P extends HotUpdaterClientPlugin>(plugin: P) => P;
//#endregion
//#region src/createPluginHost.d.ts
type PluginHookName = keyof HotUpdaterClientHooks;
type PluginHookPayload<K extends PluginHookName> = Parameters<NonNullable<HotUpdaterClientHooks[K]>>[0];
/** The init settings plugins see through their context. */
interface PluginHostConfig {
  readonly baseURL: HotUpdaterBaseURL;
  readonly requestHeaders?: Record<string, string>;
  readonly requestTimeout?: number;
  readonly onError?: (error: unknown) => void;
}
/**
 * What plugins read from the app and the device. A device SDK backs it with
 * its native module; `@hot-updater/test-utils/react-native` backs it with
 * fakes.
 */
interface PluginHostEnvironment {
  fetch(url: string, init: RequestInit): Promise<Response>;
  readonly platform: "ios" | "android";
  readonly isDebugBuild: boolean;
  readonly sdkVersion: string;
  getInstallId(): string;
  getAppVersion(): string | null;
  getMinBundleId(): string;
  getBundleId(): string;
  getChannel(): string;
  getCohort(): string;
  getFingerprintHash(): string | null;
  getStorageItem(key: string): string | null;
  setStorageItem(key: string, value: string | null): void;
  now(): number;
}
interface PluginHost {
  /**
   * Sets up the plugins of an init call and returns their APIs by plugin
   * id. A plugin passed to an earlier call keeps its hooks and its API, and
   * a plugin left out stops receiving events.
   */
  configurePlugins(plugins: readonly HotUpdaterClientPlugin[] | undefined, config: PluginHostConfig): Readonly<Record<string, unknown>>;
  /** Whether any plugin listens to this hook, so callers build events only when one does. */
  hasPluginHook(name: PluginHookName): boolean;
  /**
   * Builds a hook's event when a plugin listens. A failure to build it is
   * reported, not thrown, since reporting never changes an update.
   */
  buildPluginEvent<K extends PluginHookName>(name: K, createPayload: () => PluginHookPayload<K> | null): PluginHookPayload<K> | null;
  /**
   * Calls a hook on every plugin that listens, without waiting for any. It
   * returns when each asynchronous hook settles, for observers such as
   * `@hot-updater/test-utils`; the SDK ignores it.
   */
  dispatchPluginHook<K extends PluginHookName>(name: K, payload: PluginHookPayload<K>): readonly Promise<void>[];
  /** Builds a hook's event when a plugin listens and calls the hook right away. */
  emitPluginHook<K extends PluginHookName>(name: K, createPayload: () => PluginHookPayload<K> | null): void;
}
/** Where a plugin's key lives in native storage. */
declare const pluginStorageKey: (pluginId: string, key: string) => string;
declare const createPluginHost: (environment: PluginHostEnvironment) => PluginHost;
//#endregion
//#region src/releaseCatalog.d.ts
declare const RELEASE_CATALOG_SCHEMA_VERSION: 1;
declare const RELEASE_CATALOG_FALLBACK_POLICY: "BUILTIN_IF_ACTIVE_INELIGIBLE";
declare const MAX_CRASHED_BUNDLES = 10;
declare const MAX_TARGET_COHORTS_PER_RELEASE = 100;
declare const MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE = 512;
declare const MAX_COMPILED_CATALOG_BYTES: number;
type ReleaseKind = "BUNDLE";
type ReleaseStrategy = "APP_VERSION" | "FINGERPRINT";
type ReleaseOperation = "DEPLOY" | "PROMOTE" | "ROLLBACK";
type SelectionKind = ReleaseKind | "BUILTIN";
interface Release {
  readonly id: string;
  readonly revision: number;
  readonly channelId: string;
  readonly platform: "ios" | "android";
  readonly kind: ReleaseKind;
  readonly bundleId: string | null;
  readonly strategy: ReleaseStrategy;
  readonly targetAppVersion: string | null;
  readonly fingerprintHash: string | null;
  readonly enabled: boolean;
  readonly shouldForceUpdate: boolean;
  readonly message: string | null;
  readonly rolloutCohortCount: number;
  readonly targetCohorts: readonly string[];
  readonly operation: ReleaseOperation;
  readonly sourceReleaseId: string | null;
  readonly createdAtMs: number;
  readonly updatedAtMs: number;
}
interface ReleaseCatalogDescriptor {
  readonly releaseId: string;
  readonly kind: ReleaseKind;
  readonly bundleId: string | null;
  readonly rolloutCohortCount: number;
  readonly targetCohorts: readonly string[];
  readonly shouldForceUpdate: boolean;
  readonly message: string | null;
}
interface ReleaseCatalog {
  readonly schemaVersion: typeof RELEASE_CATALOG_SCHEMA_VERSION;
  readonly catalogId: string;
  readonly scopeKey: string;
  readonly generation: number;
  readonly catalogHash: string;
  readonly fallbackPolicy: typeof RELEASE_CATALOG_FALLBACK_POLICY;
  /** Release descriptors ordered newest first. */
  readonly releases: readonly ReleaseCatalogDescriptor[];
  /**
   * Enabled compatible Releases ordered newest first, where a device keeps its
   * active Release or rolls back to the newest Release before it.
   */
  readonly rollbackReleases: readonly ReleaseCatalogDescriptor[];
}
interface CatalogHighWater {
  readonly generation: number;
  readonly catalogHash: string;
}
interface PersistedSelectionReceipt {
  readonly kind: SelectionKind;
  readonly releaseId: string | null;
  readonly bundleId: string;
  readonly catalogId: string | null;
  readonly scopeKey: string | null;
  readonly generation: number | null;
  readonly catalogHash: string | null;
  readonly channel: string;
  readonly selectionContextHash: string | null;
}
interface ReleaseSelectionInput {
  readonly builtInBundleId: string;
  readonly currentBundleId: string;
  readonly activeReleaseId?: string | null;
  /**
   * The Release of the bundle the app is running, which differs from
   * `activeReleaseId` while a newer bundle is staged for the next launch.
   * Defaults to `activeReleaseId`; null compares by `currentBundleId`.
   */
  readonly runningReleaseId?: string | null;
  readonly minimumReleaseId: string;
  readonly cohort: string | null | undefined;
  readonly crashedBundleIds: readonly string[];
}
interface ReleaseSelectionContextInput {
  readonly activeBundleId?: string | null;
  readonly activeReleaseId?: string | null;
  readonly cohort: string | null | undefined;
  readonly minimumReleaseId: string;
  readonly strategy: ReleaseStrategy;
  readonly strategyValue: string;
  readonly crashedBundleIds: readonly string[];
}
declare function createReleaseSelectionContextHash(input: ReleaseSelectionContextInput): string;
type DesiredRelease = {
  readonly kind: SelectionKind;
  readonly releaseId: string | null;
  readonly bundleId: string;
  readonly release: ReleaseCatalogDescriptor | null;
  readonly status: "UPDATE" | "ROLLBACK";
  /**
   * Whether the device must apply this transition immediately: every rollback,
   * and an update when a forced Release the device's cohort was eligible for
   * lies after the running bundle's Release, up to and including the selected
   * Release. Skipping past a forced Release, or staging a newer one before
   * it was forced, does not drop its requirement.
   */
  readonly shouldForceUpdate: boolean;
};
declare function isReleaseEligibleForCohort(release: Pick<ReleaseCatalogDescriptor, "releaseId" | "rolloutCohortCount" | "targetCohorts">, cohort: string | null | undefined): boolean;
declare function selectDesiredRelease(catalog: ReleaseCatalog, input: ReleaseSelectionInput): DesiredRelease | null;
type CatalogAcceptance = {
  readonly accepted: true;
  readonly shouldAdvanceHighWater: boolean;
} | {
  readonly accepted: false;
  readonly reason: "STALE_GENERATION" | "GENERATION_HASH_MISMATCH";
};
declare function assessCatalogAcceptance(incoming: CatalogHighWater, highestSeen: CatalogHighWater | null): CatalogAcceptance;
type ReleaseTransitionAuthorization = {
  readonly authorized: true;
  readonly reason: "FIRST_AUTHENTICATED_SELECTION" | "NEWER_POLICY" | "CONTEXT_RESELECTION" | "EXPLICIT_SCOPE_SWITCH";
} | {
  readonly authorized: false;
  readonly reason: "BACKWARD_NOT_AUTHORIZED" | "EMPTY_TARGET_SCOPE" | "STALE_GENERATION" | "UNSOLICITED_SCOPE";
};
declare function authorizeReleaseTransition(input: {
  readonly active: PersistedSelectionReceipt | null;
  readonly desired: PersistedSelectionReceipt;
  readonly explicitScopeSwitch: boolean;
}): ReleaseTransitionAuthorization;
//#endregion
//#region src/releaseCatalogScope.d.ts
declare function normalizeChannelName(channel: string): string;
declare function assertCanonicalChannelName(channel: string): void;
declare function encodeChannelKey(channel: string): string;
declare function decodeChannelKey(channelKey: string): string;
type ReleaseCatalogScopeKeyInput = {
  readonly platform: Platform;
  readonly channelKey: string;
} & ({
  readonly strategy: "APP_VERSION";
  readonly fingerprintHash?: never;
} | {
  readonly strategy: "FINGERPRINT";
  readonly fingerprintHash: string;
});
declare function createReleaseCatalogScopeKey(input: ReleaseCatalogScopeKeyInput): string;
declare function parseReleaseCatalogScopeKey(scopeKey: string): ReleaseCatalogScopeKeyInput;
//#endregion
//#region src/releaseCatalogWire.d.ts
/** The largest release catalog response body a client accepts, in UTF-8 bytes. */
declare const MAX_RELEASE_CATALOG_WIRE_BYTES: number;
/** The scope a client asked for: the catalog it accepts must be this scope's. */
type ExpectedReleaseCatalogScope = {
  readonly channelKey: string;
  readonly platform: "ios" | "android";
} & ({
  readonly strategy: "APP_VERSION";
  readonly fingerprintHash?: never;
} | {
  readonly strategy: "FINGERPRINT";
  readonly fingerprintHash: string;
});
/** The length of `value` in UTF-8 bytes, without an encoder the device may lack. */
declare const getUtf8ByteLength: (value: string) => number;
/** Whether the catalog is the expected scope's. */
declare const hasExpectedReleaseCatalogScope: (catalog: Pick<ReleaseCatalog, "scopeKey">, expected: ExpectedReleaseCatalogScope) => boolean;
/**
 * Parses a release catalog response body as a client accepts it: within the
 * wire limit, in the schema's shape, for the expected scope, and within the
 * cohort limits. Any other body is null. The device's update client and
 * doctor's server checks both run this, so they accept the same catalogs.
 */
declare const parseReleaseCatalog: (body: string, expectedScope: ExpectedReleaseCatalogScope) => ReleaseCatalog | null;
//#endregion
//#region src/rollout.d.ts
declare const NUMERIC_COHORT_SIZE = 1000;
declare const DEFAULT_ROLLOUT_COHORT_COUNT = 1000;
declare const MAX_COHORT_LENGTH = 64;
declare const INVALID_COHORT_ERROR_MESSAGE = "Invalid cohort. Use 1-1000 or a lowercase slug without spaces, up to 64 characters.";
declare function normalizeRolloutCohortCount(rolloutCohortCount: number | null | undefined): number;
declare function normalizeCohortValue(cohort: string): string;
declare function getNumericCohortValue(cohort: string): number | null;
declare function isNumericCohort(cohort: string): boolean;
declare function isCustomCohort(cohort: string): boolean;
declare function isValidCohort(cohort: string): boolean;
declare function getDefaultNumericCohort(identifier: string): string;
declare function getNumericCohortRolloutPosition(bundleId: string, cohortValue: number): number;
declare function getRolledOutNumericCohorts(bundleId: string, rolloutCohortCount: number | null | undefined): number[];
declare function isCohortEligibleForUpdate(bundleId: string, cohort: string | null | undefined, rolloutCohortCount: number | null | undefined, targetCohorts: readonly string[] | null | undefined): boolean;
//#endregion
//#region src/uuid.d.ts
declare const NIL_UUID = "00000000-0000-0000-0000-000000000000";
declare const isUUIDv7: (value: unknown) => value is string;
//#endregion
export { ARTIFACT_FILES_PROTOCOL_VERSION, ARTIFACT_FILES_REQUEST_LIMIT, ARTIFACT_PROTOCOL_VERSION, AppReadyResult, ArtifactAsset, ArtifactAssetFile, ArtifactFiles, ArtifactFilesRequest, ArtifactInfo, ArtifactInfoV2, Bundle, BundleDownloadedInfo, BundleMetadata, BundlePatchArtifact, CatalogAcceptance, CatalogHighWater, ChangedAssetPatch, ClientPluginApi, ClientPluginApis, DEFAULT_ROLLOUT_COHORT_COUNT, DesiredRelease, ExpectedReleaseCatalogScope, HotUpdaterBaseURL, HotUpdaterClientContext, HotUpdaterClientHooks, HotUpdaterClientPlugin, HotUpdaterClientSetup, HotUpdaterClientStorage, INVALID_COHORT_ERROR_MESSAGE, MAX_COHORT_LENGTH, MAX_COMPILED_CATALOG_BYTES, MAX_CRASHED_BUNDLES, MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE, MAX_RELEASE_CATALOG_WIRE_BYTES, MAX_TARGET_COHORTS_PER_RELEASE, ManifestArchive, NIL_UUID, NUMERIC_COHORT_SIZE, PersistedSelectionReceipt, Platform, PluginHookName, PluginHookPayload, PluginHost, PluginHostConfig, PluginHostEnvironment, RELEASE_CATALOG_FALLBACK_POLICY, RELEASE_CATALOG_SCHEMA_VERSION, Release, ReleaseCatalog, ReleaseCatalogDescriptor, ReleaseCatalogScopeKeyInput, ReleaseKind, ReleaseOperation, ReleaseSelectionContextInput, ReleaseSelectionInput, ReleaseStrategy, ReleaseTransitionAuthorization, ReleaseTransitionKind, SelectionKind, UpdateCheckResult, UpdateError, UpdateErrorReason, UpdateErrorResource, UpdateErrorStage, UpdateErrorTransport, UpdateHttpResponse, UpdateStatus, UpdateStrategy, assertCanonicalChannelName, assessCatalogAcceptance, authorizeReleaseTransition, canonicalizeAppVersion, createPluginHost, createReleaseCatalogScopeKey, createReleaseSelectionContextHash, decodeChannelKey, defineClientPlugin, encodeChannelKey, getAssetBaseStorageUri, getBundlePatch, getBundlePatches, getDefaultNumericCohort, getManifestFileHash, getManifestStorageUri, getNumericCohortRolloutPosition, getNumericCohortValue, getPatchBaseBundleId, getPatchBaseFileHash, getPatchFileHash, getPatchStorageUri, getRolledOutNumericCohorts, getUtf8ByteLength, hasExpectedReleaseCatalogScope, isCohortEligibleForUpdate, isCustomCohort, isNumericCohort, isReleaseEligibleForCohort, isUUIDv7, isValidCohort, normalizeChannelName, normalizeCohortValue, normalizeRolloutCohortCount, parseReleaseCatalog, parseReleaseCatalogScopeKey, pluginStorageKey, resolveBaseURL, selectDesiredRelease };