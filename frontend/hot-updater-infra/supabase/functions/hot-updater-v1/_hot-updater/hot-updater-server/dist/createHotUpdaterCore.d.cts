import { CoreApi } from "./core/api.cjs";
import { AnyHotUpdaterPlugin, PluginApis } from "./plugins/definePlugin.cjs";
import { HotUpdaterHandlers } from "./handlerTypes.cjs";
import "./handler.cjs";
import { PluginClientPlugin, StorageAdapter, ToolingDatabase } from "@hot-updater/plugin-core";
//#region src/createHotUpdaterCore.d.ts
/** A plugin's endpoint on `handlers.client`. */
interface ClientEndpoint {
  /** The id of the plugin that adds it. */
  readonly plugin: string;
  readonly method: string;
  /** Relative to the handler's mount; `:name` segments are parameters. */
  readonly path: string;
}
/** The plugin that decides who may call client routes. */
interface ClientAuthProvider {
  /** Its id. */
  readonly plugin: string;
  /**
   * The request headers its decision reads, lowercase: what a cache in
   * front of the server, such as a CDN, keys client routes on.
   */
  readonly varyHeaders: readonly string[];
}
type RuntimeHotUpdaterAPI<TPlugins extends readonly AnyHotUpdaterPlugin[] = readonly AnyHotUpdaterPlugin[]> = {
  /**
   * The routes a host mounts. On first access the storage must serve
   * downloads (`get` and `getDownloadUrl`), so a server fails where it
   * mounts them, while tooling that only reads the definition, such as the
   * CLI, can configure storage that only uploads.
   */
  readonly handlers: HotUpdaterHandlers;
  /**
   * Core's reads and typed writes: bundles, Releases, Catalogs, and
   * channels. The CLI and the console write through it, so their writes
   * take the server's path: the plugins' schema fence, pruning during
   * writes, the storage's file URLs, and the database's CDN purge.
   */
  readonly core: CoreApi;
  /** Each plugin's API by plugin id, which the CLI's and the console's plugin features call. */
  readonly api: PluginApis<TPlugins>;
  /** The database's name, which `hot-updater db` commands read. */
  readonly adapterName: string;
  /**
   * Applies aggregate changes the database batches that are still pending:
   * this process's buffer, and the log rows no compaction has merged yet.
   * A long-lived server with `aggregateBatching: { mode: "memory" }` calls
   * it before it exits.
   */
  readonly flush: () => Promise<void>;
  /**
   * The database as configured. `hot-updater db` runs its tooling
   * (`createMigrator`, `generateSchema`), and tooling done with the server
   * closes it (`dispose`).
   */
  readonly database: ToolingDatabase;
  /** The storage as configured. */
  readonly storage: StorageAdapter;
  /** The plugins as configured, as a frozen copy, whose tables tooling creates. */
  readonly plugins: TPlugins;
  /**
   * The client plugins an app adds to `HotUpdater.init`'s `plugins` for
   * these plugins, each once, in plugin order: what init prints.
   */
  readonly clientPlugins: readonly PluginClientPlugin[];
  /**
   * The plugins' endpoints on `handlers.client`, which a host that routes
   * by path, such as a CDN in front of the server, sends to it.
   */
  readonly clientEndpoints: readonly ClientEndpoint[];
  /** The plugin that guards client routes; absent when they are public. */
  readonly clientAuth?: ClientAuthProvider;
};
type HotUpdaterAPI = RuntimeHotUpdaterAPI;
/** Leaves client routes public; required when no plugin provides clientAuth. */
type ClientAccessPolicy = "public";
type ProvidesClientAuth<TPlugin> = TPlugin extends {
  readonly provides?: infer TProvides;
} ? TProvides extends {
  readonly clientAuth: true;
} ? true : false : false;
type ClientAuthIds<TPlugins extends readonly unknown[], TFound extends string[] = []> = TPlugins extends readonly [infer THead, ...infer TTail] ? ClientAuthIds<TTail, ProvidesClientAuth<THead> extends true ? [...TFound, THead extends {
  readonly id: infer TId extends string;
} ? TId : string] : TFound> : TFound;
type JoinIds<TIds extends string[]> = TIds extends [infer TFirst extends string, ...infer TRest extends string[]] ? TRest extends [] ? `"${TFirst}"` : `"${TFirst}", ${JoinIds<TRest>}` : "";
/**
 * Client routes have one policy source: exactly one plugin that provides
 * clientAuth, or an explicit `clientAccess`. Tuples are counted here; an
 * untyped list that may hold a clientAuth plugin is left to startup.
 */
type ClientAccessRule<TPlugins extends readonly AnyHotUpdaterPlugin[]> = number extends TPlugins["length"] ? true extends ProvidesClientAuth<TPlugins[number]> ? {
  readonly clientAccess?: "Remove clientAccess: a plugin in this list may provide clientAuth";
} : {
  readonly clientAccess: ClientAccessPolicy;
} : ClientAuthIds<TPlugins> extends [] ? {
  readonly clientAccess: ClientAccessPolicy;
} : ClientAuthIds<TPlugins> extends [infer TId extends string] ? {
  readonly clientAccess?: `Remove clientAccess: plugin "${TId}" provides clientAuth`;
} : {
  readonly clientAuth: `Keep one clientAuth plugin: ${JoinIds<ClientAuthIds<TPlugins>>} all provide it`;
};
type CreateHotUpdaterOptions<TPlugins extends readonly AnyHotUpdaterPlugin[] = readonly []> = {
  /** A provider's database on the storage engine, such as `kyselyAdapter(...)` or `postgres(...)`. */
  readonly database: ToolingDatabase;
  /**
   * Where bundles are stored, the same adapter `hot-updater.config.ts`
   * uploads with: the server reads the URIs of its protocol and returns
   * their download URLs.
   */
  readonly storage: StorageAdapter;
  /** The plugins the server runs; at most one provides clientAuth. Defaults to none. */
  readonly plugins?: TPlugins;
} & ClientAccessRule<TPlugins>;
declare function createHotUpdater<const TPlugins extends readonly AnyHotUpdaterPlugin[] = readonly []>(options: CreateHotUpdaterOptions<TPlugins>): RuntimeHotUpdaterAPI<NoInfer<TPlugins>>;
//#endregion
export { ClientAccessPolicy, ClientAccessRule, ClientAuthProvider, ClientEndpoint, CreateHotUpdaterOptions, HotUpdaterAPI, RuntimeHotUpdaterAPI, createHotUpdater };