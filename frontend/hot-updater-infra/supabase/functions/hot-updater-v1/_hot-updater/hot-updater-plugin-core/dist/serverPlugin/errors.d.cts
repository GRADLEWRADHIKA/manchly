//#region src/serverPlugin/errors.d.ts
type ConstraintReason = "exists" | "unique" | "not_found" | "referenced" | "too_large";
declare class DatabaseConstraintError extends Error {
  readonly reason: ConstraintReason;
  readonly model: string;
  readonly name = "DatabaseConstraintError";
  constructor(reason: ConstraintReason, model: string);
}
/** The retry budget ran out; ingestion answers 503 with Retry-After. */
declare class DatabaseConflictError extends Error {
  readonly name = "DatabaseConflictError";
}
/** The write may or may not have committed; it is reported, never rerun. */
declare class DatabaseAmbiguousCommitError extends Error {
  readonly name = "DatabaseAmbiguousCommitError";
}
declare class DatabaseTransactionError extends Error {
  readonly name = "DatabaseTransactionError";
}
/** A read that does not fit its model, such as an unknown index, a missing `where` field, or an out-of-range limit. */
declare class DatabaseQueryError extends Error {
  readonly name = "DatabaseQueryError";
}
/** A malformed cursor, or one from a read with another model, index, filter, order, or range. */
declare class DatabaseCursorError extends Error {
  readonly name = "DatabaseCursorError";
}
//#endregion
export { ConstraintReason, DatabaseAmbiguousCommitError, DatabaseConflictError, DatabaseConstraintError, DatabaseCursorError, DatabaseQueryError, DatabaseTransactionError };