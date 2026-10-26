import { CoreDatabase, CoreStorage } from "./reads.cjs";
//#region src/core/api.d.ts
interface CoreApiOptions {
  readonly now?: () => number;
  /** The database's CDN purge, called after a write that changes a Release Catalog. */
  readonly onCachedRoutesChange?: () => Promise<void>;
}
/** Core's reads and typed writes over one database handle. */
declare const createCoreApi: (db: CoreDatabase, storage: CoreStorage, options?: CoreApiOptions) => {
  /** One read, which checks the schema settings first. */
  ready: () => Promise<void>;
  deploy: (deployments: readonly import("@hot-updater/plugin-core").Deployment[]) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogMutationResult[]>;
  updateReleasePolicy: (input: import("@hot-updater/plugin-core").ReleaseTarget & {
    readonly patch: import("@hot-updater/plugin-core").ReleasePolicyPatch;
  }) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogMutationResult>;
  preflightReleasePolicy: (input: import("@hot-updater/plugin-core").ReleaseTarget & {
    readonly patch: import("@hot-updater/plugin-core").ReleasePolicyPatch;
  }) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogMutationPreflight>;
  deleteRelease: (input: import("@hot-updater/plugin-core").ReleaseTarget) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogMutationResult>;
  promoteRelease: (input: import("@hot-updater/plugin-core").ReleaseTarget & {
    readonly targetChannel: string;
    readonly action?: "copy" | "move";
  }) => Promise<import("@hot-updater/plugin-core").PromoteReleaseResult>;
  rebuildReleaseCatalog: (scopeKey: string) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogRebuildResult>;
  preflightReleaseCatalogRebuild: (scopeKey: string) => Promise<import("@hot-updater/plugin-core").ReleaseCatalogRebuildPreflight>;
  ensureChannel: (name: string) => Promise<import("@hot-updater/plugin-core").ChannelRow>;
  deleteChannel: (id: string) => Promise<import("@hot-updater/plugin-core").ChannelDeleteResult>;
  updateBundle: (id: string, update: Partial<Omit<import("@hot-updater/protocol").Bundle, "id" | "patches">> & {
    readonly patches?: import("@hot-updater/protocol").Bundle["patches"];
  }) => Promise<void>;
  deleteBundles: (ids: readonly string[]) => Promise<void>;
  getReleaseCatalog(input: import("@hot-updater/plugin-core").ReleaseCatalogRequest): Promise<import("@hot-updater/protocol").ReleaseCatalog | null>;
  getArtifactInfo(targetBundleId: string, currentBundleId: string, artifactProtocolVersion: 1): Promise<import("@hot-updater/protocol").ArtifactInfo | null>;
  getArtifactInfo(targetBundleId: string, currentBundleId: string, artifactProtocolVersion: 2): Promise<import("@hot-updater/protocol").ArtifactInfoV2 | null>;
  getArtifactFiles(bundleId: string, paths: readonly string[]): Promise<import("@hot-updater/protocol").ArtifactFiles | null>;
  getBundle(id: string): Promise<import("@hot-updater/plugin-core").BundleDetail | null>;
  countBundleChildren(baseBundleIds: readonly string[]): Promise<Record<string, number>>;
  listPatchesFromBase(baseBundleId: string, input: import("@hot-updater/plugin-core").KeysetInput): Promise<import("@hot-updater/plugin-core").BundlePatchRow[]>;
  listBundles(input: import("@hot-updater/plugin-core").KeysetInput & {
    readonly platform?: "ios" | "android";
  }): Promise<import("@hot-updater/plugin-core").BundleDetail[]>;
  countBundles(platform?: "ios" | "android"): Promise<number>;
  findBaseBundleIds(candidateKey: string, bundleId: string, limit: number): Promise<string[]>;
  getRelease(id: string): Promise<import("@hot-updater/plugin-core").ReleaseRow | null>;
  listReleases(input: import("@hot-updater/plugin-core").KeysetInput & {
    readonly filter: import("@hot-updater/plugin-core").ReleaseFilter;
  }): Promise<import("@hot-updater/plugin-core").ReleaseRow[]>;
  latestReleaseId(scopeKey: string): Promise<string | null>;
  getReleaseCatalogRow(scopeKey: string): Promise<import("@hot-updater/plugin-core").ReleaseCatalogRow | null>;
  listReleaseCatalogs(input: import("@hot-updater/plugin-core").KeysetInput): Promise<import("@hot-updater/plugin-core").ReleaseCatalogRow[]>;
  listChannels(): Promise<import("@hot-updater/plugin-core").ChannelRow[]>;
  findChannelByName(name: string): Promise<import("@hot-updater/plugin-core").ChannelRow | null>;
};
type CoreApi = ReturnType<typeof createCoreApi>;
//#endregion
export { CoreApi, CoreApiOptions, createCoreApi };