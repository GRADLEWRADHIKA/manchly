//#region src/shared/wire.d.ts
/** What a device tells the server, so the server can evaluate conditions. */
interface RemoteConfigDeviceContext {
  readonly platform: "ios" | "android";
  /** The native app version, or null when the build has none. */
  readonly appVersion: string | null;
  readonly channel: string;
  /** A numeric cohort from 1 to 1000, or a custom cohort's slug. */
  readonly cohort: string;
  /** The native build's fingerprint, or null without one. */
  readonly fingerprintHash: string | null;
}
/** The body of a `200` from `GET /remote-config`. */
interface RemoteConfigFetchResponse {
  /** The published template version the values come from; 0 before the first publish. */
  readonly version: number;
  /**
   * Each parameter's value for this device, as text. A parameter whose
   * value is the app's own default is left out.
   */
  readonly values: Readonly<Record<string, string>>;
}
//#endregion
export { RemoteConfigDeviceContext, RemoteConfigFetchResponse };