//#region src/server/errors.d.ts
/**
 * What Insights' API throws for an input it refuses, such as an unknown
 * event field or a malformed cursor; its routes answer 400 for it.
 */
declare class InsightsBadRequestError extends Error {
  readonly name = "InsightsBadRequestError";
}
//#endregion
export { InsightsBadRequestError };