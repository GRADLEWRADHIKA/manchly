//#region src/databaseErrors.ts
/** A bundle an operation names is not stored. */
var DatabaseBundleNotFoundError = class extends Error {
	bundleId;
	name = "DatabaseBundleNotFoundError";
	constructor(bundleId) {
		super(`Bundle "${bundleId}" was not found.`);
		this.bundleId = bundleId;
	}
};
/** A row a delete names is still referenced, such as a bundle a release uses. */
var DatabaseRowReferencedError = class extends Error {
	name = "DatabaseRowReferencedError";
	constructor() {
		super("The database row is still referenced.");
	}
};
/** Input a database operation refuses before touching storage. */
var DatabaseAdapterInputError = class extends Error {
	code;
	name = "DatabaseAdapterInputError";
	constructor(code) {
		super(`Invalid database adapter input: ${code}`);
		this.code = code;
	}
};
//#endregion
exports.DatabaseAdapterInputError = DatabaseAdapterInputError;
exports.DatabaseBundleNotFoundError = DatabaseBundleNotFoundError;
exports.DatabaseRowReferencedError = DatabaseRowReferencedError;
