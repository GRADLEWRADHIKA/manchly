import { HotUpdaterClientPlugin } from "@hot-updater/protocol";
//#region src/client/index.d.ts
/** An in-app default value: text, a number, or a boolean. */
type RemoteConfigDefaultValue = string | number | boolean;
type RemoteConfigDefaults = Readonly<Record<string, RemoteConfigDefaultValue>>;
/**
 * Where a value comes from: `remote` from the activated values, `default`
 * from the in-app defaults. A key neither has reads as `null`.
 */
type RemoteConfigValueSource = "default" | "remote";
/** How the last fetch ended: `failure` for any error, a `429` included. */
type RemoteConfigFetchStatus = "no-fetch-yet" | "success" | "failure";
/** A parameter's value, read as the type the app expects. */
interface RemoteConfigValue {
  /** The text, `""` included. */
  asString(): string;
  /** The text as a number, `0` included; 0 for text that is not a number. */
  asNumber(): number;
  /** Whether the text is `1`, `true`, `t`, `yes`, `y`, or `on`, in any case. */
  asBoolean(): boolean;
  getSource(): RemoteConfigValueSource;
}
/** No defaults: every key may read as `null`. */
type NoDefaults = Record<never, never>;
interface RemoteConfigOptions<TDefaults extends RemoteConfigDefaults = NoDefaults> {
  /** Values the app uses until it activates fetched ones, and for keys the template leaves to it. */
  readonly defaults?: TDefaults;
  /**
   * The shortest time between fetches that reach the server; a fetch
   * sooner keeps the values fetched last. Defaults to 12 hours. A fetch
   * always reaches the server after the app's channel, version, cohort, or
   * fingerprint changes.
   */
  readonly minimumFetchIntervalMs?: number;
}
interface RemoteConfigFetchOptions {
  /**
   * Asks the server even within `minimumFetchIntervalMs`, for a moment that
   * needs fresh values, such as pull to refresh. Each one is a request (a
   * `304` when nothing changed).
   */
  readonly force?: boolean;
}
/** A defaults key, with any other key still accepted. */
type RemoteConfigKey<TDefaults> = (keyof TDefaults & string) | (string & {});
/**
 * What a read of `TKey` returns: `T` for a key `defaults` declares, which
 * always has a value, and `T | null` for any other key. Defaults typed as
 * a map of any string, such as `RemoteConfigDefaults`, declare no key.
 */
type RemoteConfigRead<TDefaults, TKey extends string, T> = string extends keyof TDefaults ? T | null : TKey extends keyof TDefaults ? T : T | null;
/**
 * Remote Config on the instance `HotUpdater.init` returns, as
 * `hotUpdater.remoteConfig`.
 */
interface RemoteConfigClient<TDefaults extends RemoteConfigDefaults = NoDefaults> {
  /**
   * A parameter's value: the active remote value, else the in-app default,
   * else `null`. Reads are synchronous; `init` loads the values the app
   * activated last from the device. `false`, `0`, and `""` are values, not
   * missing ones.
   */
  getValue<TKey extends RemoteConfigKey<TDefaults>>(key: TKey): RemoteConfigRead<TDefaults, TKey, RemoteConfigValue>;
  getString<TKey extends RemoteConfigKey<TDefaults>>(key: TKey): RemoteConfigRead<TDefaults, TKey, string>;
  getNumber<TKey extends RemoteConfigKey<TDefaults>>(key: TKey): RemoteConfigRead<TDefaults, TKey, number>;
  getBoolean<TKey extends RemoteConfigKey<TDefaults>>(key: TKey): RemoteConfigRead<TDefaults, TKey, boolean>;
  /**
   * Every key the defaults or the active values have. The object stays the
   * same until the values change, so it suits `useSyncExternalStore`.
   */
  getAll(): Readonly<Record<string, RemoteConfigValue>>;
  /**
   * Fetches this device's values from `GET /remote-config` on the
   * `baseURL` the app configured, with its request headers, and keeps them
   * for `activate`; active values do not change. Within
   * `minimumFetchIntervalMs` of the last successful fetch it keeps those
   * values without a request, unless `force` is set. Rejects when the server
   * cannot be reached or runs without the `remoteConfig()` plugin.
   */
  fetch(options?: RemoteConfigFetchOptions): Promise<void>;
  /** Makes the fetched values active; true when they replaced other values. */
  activate(): Promise<boolean>;
  /**
   * `fetch(options)`, then `activate()`, for an app that applies new values
   * as soon as they arrive. Resolves as `activate` does; rejects as `fetch`
   * does, and the active values stay.
   */
  fetchAndActivate(options?: RemoteConfigFetchOptions): Promise<boolean>;
  readonly lastFetchStatus: RemoteConfigFetchStatus;
  /** When the last successful fetch ended, in ms since the epoch; `null` before one. */
  readonly fetchedAtMs: number | null;
  /** The template version the active values come from; 0 before any. */
  readonly activeVersion: number;
  /** Calls `listener` whenever the active values change; returns the unsubscribe. */
  subscribe(listener: () => void): () => void;
}
/** The `remoteConfig()` plugin: it adds `hotUpdater.remoteConfig`. */
type RemoteConfigPlugin<TDefaults extends RemoteConfigDefaults = NoDefaults> = HotUpdaterClientPlugin<"remoteConfig", RemoteConfigClient<TDefaults>>;
/**
 * Remote Config for the app: in-app defaults, values a server running the
 * `remoteConfig()` plugin picks for this device, and a fetch and activate
 * step between them. Add it to `HotUpdater.init`'s `plugins`, and read it
 * from the instance `init` returns, as `hotUpdater.remoteConfig`. It fetches
 * from the `baseURL`, request headers, and timeout configured there.
 *
 * @example
 * ```ts
 * import { HotUpdater, remoteConfig } from "@hot-updater/react-native";
 *
 * export const hotUpdater = HotUpdater.init({
 *   baseURL,
 *   plugins: [
 *     remoteConfig({ defaults: { welcome_message: "Welcome", max_items: 20 } }),
 *   ],
 * });
 *
 * hotUpdater.remoteConfig.fetchAndActivate().catch(() => {});
 * hotUpdater.remoteConfig.getString("welcome_message");
 * ```
 */
declare const remoteConfig: <const TDefaults extends RemoteConfigDefaults = NoDefaults>(options?: RemoteConfigOptions<TDefaults>) => RemoteConfigPlugin<TDefaults>;
//#endregion
export { RemoteConfigClient, RemoteConfigDefaultValue, RemoteConfigDefaults, RemoteConfigFetchOptions, RemoteConfigFetchStatus, RemoteConfigKey, RemoteConfigOptions, RemoteConfigPlugin, RemoteConfigRead, RemoteConfigValue, RemoteConfigValueSource, remoteConfig };