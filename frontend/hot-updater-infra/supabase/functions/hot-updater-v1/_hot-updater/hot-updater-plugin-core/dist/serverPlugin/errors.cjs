//#region src/serverPlugin/errors.ts
var DatabaseConstraintError = class extends Error {
	reason;
	model;
	name = "DatabaseConstraintError";
	constructor(reason, model) {
		super(`${model}: ${reason}`);
		this.reason = reason;
		this.model = model;
	}
};
/** The retry budget ran out; ingestion answers 503 with Retry-After. */
var DatabaseConflictError = class extends Error {
	name = "DatabaseConflictError";
};
/** The write may or may not have committed; it is reported, never rerun. */
var DatabaseAmbiguousCommitError = class extends Error {
	name = "DatabaseAmbiguousCommitError";
};
var DatabaseTransactionError = class extends Error {
	name = "DatabaseTransactionError";
};
/** A read that does not fit its model, such as an unknown index, a missing `where` field, or an out-of-range limit. */
var DatabaseQueryError = class extends Error {
	name = "DatabaseQueryError";
};
/** A malformed cursor, or one from a read with another model, index, filter, order, or range. */
var DatabaseCursorError = class extends Error {
	name = "DatabaseCursorError";
};
//#endregion
exports.DatabaseAmbiguousCommitError = DatabaseAmbiguousCommitError;
exports.DatabaseConflictError = DatabaseConflictError;
exports.DatabaseConstraintError = DatabaseConstraintError;
exports.DatabaseCursorError = DatabaseCursorError;
exports.DatabaseQueryError = DatabaseQueryError;
exports.DatabaseTransactionError = DatabaseTransactionError;
