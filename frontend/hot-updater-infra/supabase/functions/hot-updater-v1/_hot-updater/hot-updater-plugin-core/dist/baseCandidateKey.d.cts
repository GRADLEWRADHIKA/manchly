//#region src/baseCandidateKey.d.ts
/** A new bundle's auto-patch target: where it is released, and to whom. */
interface BaseCandidateTarget {
  readonly channel: string;
  readonly platform: "ios" | "android";
  readonly fingerprintHash: string | null;
  readonly appVersion: string | null;
}
/** What a base-candidate key names: a catalog scope, and an app-version scope's target range. */
interface BaseCandidateQuery {
  readonly scopeKey: string;
  readonly range: string | null;
}
/**
 * A new bundle's base-candidate key, which `findBaseBundleIds` on core's API
 * and on a plugin's `ctx.core` takes: the Release Catalog scope its devices
 * update from, and for an app version its normalized range; null for a
 * target without a valid range. The CLI's deploy produces it this way.
 */
declare const targetBaseCandidateKey: (target: BaseCandidateTarget) => string | null;
/**
 * The scope and range a base-candidate key names, null for any other
 * string: what an implementation of `findBaseBundleIds` reads the key with.
 */
declare const parseBaseCandidateKey: (key: string) => BaseCandidateQuery | null;
//#endregion
export { BaseCandidateQuery, BaseCandidateTarget, parseBaseCandidateKey, targetBaseCandidateKey };