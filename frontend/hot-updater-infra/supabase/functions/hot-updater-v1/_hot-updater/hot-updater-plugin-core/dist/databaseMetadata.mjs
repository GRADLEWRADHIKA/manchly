import { DatabaseAdapterInputError } from "./databaseErrors.mjs";
import { isDatabaseMetadataObject } from "./databaseJsonValue.mjs";
//#region src/databaseMetadata.ts
const bundleMetadataToRow = (metadata) => {
	if (metadata === void 0) return {};
	if (!isDatabaseMetadataObject(metadata)) throw new DatabaseAdapterInputError("invalid-data");
	return metadata;
};
//#endregion
export { bundleMetadataToRow };
