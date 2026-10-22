import { BundleSigningAdapter } from "./types/index.cjs";
//#region src/remoteBundleSigning.d.ts
declare const REMOTE_BUNDLE_SIGNING_PATH = "/_hot-updater/signing";
declare const REMOTE_BUNDLE_SIGNING_PROTOCOL_VERSION: 1;
declare const REMOTE_BUNDLE_SIGNING_ALGORITHM: "RSA-SHA256";
declare const REMOTE_BUNDLE_SIGNING_TOKEN_HEADER = "x-hot-updater-signing-token";
type Fetch = typeof globalThis.fetch;
interface RemoteSigningOptions {
  readonly endpoint: string;
  readonly fetch?: Fetch;
  /**
   * Dedicated signing token or a lazy resolver for provider integrations.
   * Defaults to HOT_UPDATER_SIGNING_TOKEN.
   */
  readonly signingToken?: string | (() => string | Promise<string>);
}
interface BundleSigningHandlerOptions {
  /** Exact request pathname. Defaults to the root managed signing path. */
  readonly endpointPath?: string;
  readonly publicKey: string;
  readonly request: Request;
  readonly sign: (message: Uint8Array) => Uint8Array | Promise<Uint8Array>;
  readonly token: string;
}
/** Signs through a server implementing the Hot Updater signing protocol. */
declare const remoteSigning: ({ endpoint, fetch: fetchImplementation, signingToken }: RemoteSigningOptions) => BundleSigningAdapter;
/** Handles the portable managed signing protocol in Web API runtimes. */
declare const createBundleSigningHandler: ({ endpointPath, publicKey, request, sign, token }: BundleSigningHandlerOptions) => Promise<Response | null>;
//#endregion
export { BundleSigningHandlerOptions, REMOTE_BUNDLE_SIGNING_ALGORITHM, REMOTE_BUNDLE_SIGNING_PATH, REMOTE_BUNDLE_SIGNING_PROTOCOL_VERSION, REMOTE_BUNDLE_SIGNING_TOKEN_HEADER, RemoteSigningOptions, createBundleSigningHandler, remoteSigning };