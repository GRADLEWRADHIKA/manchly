const require_databaseErrors = require("./databaseErrors.cjs");
const require_databaseJsonValue = require("./databaseJsonValue.cjs");
//#region src/databaseMetadata.ts
const bundleMetadataToRow = (metadata) => {
	if (metadata === void 0) return {};
	if (!require_databaseJsonValue.isDatabaseMetadataObject(metadata)) throw new require_databaseErrors.DatabaseAdapterInputError("invalid-data");
	return metadata;
};
//#endregion
exports.bundleMetadataToRow = bundleMetadataToRow;
