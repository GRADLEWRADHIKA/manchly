//#region src/databaseErrors.d.ts
/** A bundle an operation names is not stored. */
declare class DatabaseBundleNotFoundError extends Error {
  readonly bundleId: string;
  readonly name = "DatabaseBundleNotFoundError";
  constructor(bundleId: string);
}
/** A row a delete names is still referenced, such as a bundle a release uses. */
declare class DatabaseRowReferencedError extends Error {
  readonly name = "DatabaseRowReferencedError";
  constructor();
}
type DatabaseAdapterInputErrorCode = "invalid-data" | "invalid-field" | "invalid-pagination" | "invalid-query" | "invalid-result";
/** Input a database operation refuses before touching storage. */
declare class DatabaseAdapterInputError extends Error {
  readonly code: DatabaseAdapterInputErrorCode;
  readonly name = "DatabaseAdapterInputError";
  constructor(code: DatabaseAdapterInputErrorCode);
}
//#endregion
export { DatabaseAdapterInputError, DatabaseAdapterInputErrorCode, DatabaseBundleNotFoundError, DatabaseRowReferencedError };