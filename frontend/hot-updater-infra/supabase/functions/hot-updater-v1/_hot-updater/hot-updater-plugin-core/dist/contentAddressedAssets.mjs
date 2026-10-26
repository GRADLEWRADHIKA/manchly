//#region src/contentAddressedAssets.ts
const CONTENT_ADDRESSED_ASSET_PREFIX = "assets";
const SHA256_FILE_HASH_RE = /^[0-9a-f]{64}$/;
const isContentAddressedAssetFileHash = (value) => {
	return typeof value === "string" && SHA256_FILE_HASH_RE.test(value);
};
const getContentAddressedAssetStoragePath = ({ assetPath, fileHash }) => {
	const extension = assetPath.endsWith(".br") ? ".br" : assetPath.includes(".") ? `.${assetPath.split(".").pop()}` : "";
	return `sha256/${fileHash.slice(0, 2)}/${fileHash}${extension}`;
};
//#endregion
export { CONTENT_ADDRESSED_ASSET_PREFIX, getContentAddressedAssetStoragePath, isContentAddressedAssetFileHash };
