const require_contentAddressedAssets = require("./contentAddressedAssets.cjs");
const require_createStorageKeyBuilder = require("./createStorageKeyBuilder.cjs");
const require_parseStorageUri = require("./parseStorageUri.cjs");
//#region src/assetStorageLayout.ts
const isBrotliManifestAssetPath = (assetPath) => /(^|\/)index\.[^/]+\.bundle$/.test(assetPath.replace(/\\/g, "/"));
const getManifestAssetDownloadPath = (assetPath) => isBrotliManifestAssetPath(assetPath) ? `${assetPath}.br` : assetPath;
const createStorageUriWithRelativePath = ({ baseStorageUri, relativePath }) => {
	const protocol = new URL(baseStorageUri).protocol.replace(":", "");
	const parsed = require_parseStorageUri.parseStorageUri(baseStorageUri, protocol);
	const childKey = require_createStorageKeyBuilder.createStorageKeyBuilder(void 0)(relativePath);
	if (!childKey) throw new Error("Relative storage key must not be empty.");
	return require_parseStorageUri.createStorageUri({
		protocol: parsed.protocol,
		bucket: parsed.bucket,
		key: require_createStorageKeyBuilder.createStorageKeyBuilder(parsed.key)(childKey)
	});
};
const replaceStorageUriKeySuffix = ({ storageUri, keySuffix, replacement }) => {
	const protocol = new URL(storageUri).protocol.replace(":", "");
	const parsed = require_parseStorageUri.parseStorageUri(storageUri, protocol);
	const normalizedSuffix = require_createStorageKeyBuilder.createStorageKeyBuilder(void 0)(keySuffix);
	const normalizedReplacement = require_createStorageKeyBuilder.createStorageKeyBuilder(void 0)(replacement);
	if (!normalizedSuffix || !normalizedReplacement) throw new Error("Storage URI key suffix and replacement must not be empty.");
	const keySegments = parsed.key.split("/");
	const suffixSegments = normalizedSuffix.split("/");
	const suffixOffset = keySegments.length - suffixSegments.length;
	if (suffixOffset < 0 || suffixSegments.some((segment, index) => keySegments[suffixOffset + index] !== segment)) throw new Error("Storage URI key does not end with the expected suffix.");
	const prefix = keySegments.slice(0, suffixOffset).join("/");
	return require_parseStorageUri.createStorageUri({
		protocol: parsed.protocol,
		bucket: parsed.bucket,
		key: require_createStorageKeyBuilder.createStorageKeyBuilder(prefix)(normalizedReplacement)
	});
};
const resolveManifestAssetStorageFileHash = ({ downloadFileHash, fileHash }) => require_contentAddressedAssets.isContentAddressedAssetFileHash(downloadFileHash) ? downloadFileHash : fileHash;
const getManifestAssetStoragePath = ({ assetPath, downloadFileHash, fileHash }) => require_contentAddressedAssets.getContentAddressedAssetStoragePath({
	assetPath,
	fileHash: resolveManifestAssetStorageFileHash({
		downloadFileHash,
		fileHash
	})
});
const resolveManifestAssetStorageUri = ({ assetBaseStorageUri, assetPath, downloadFileHash, fileHash }) => createStorageUriWithRelativePath({
	baseStorageUri: assetBaseStorageUri,
	relativePath: getManifestAssetStoragePath({
		assetPath,
		downloadFileHash,
		fileHash
	})
});
//#endregion
exports.createStorageUriWithRelativePath = createStorageUriWithRelativePath;
exports.getManifestAssetDownloadPath = getManifestAssetDownloadPath;
exports.getManifestAssetStoragePath = getManifestAssetStoragePath;
exports.isBrotliManifestAssetPath = isBrotliManifestAssetPath;
exports.replaceStorageUriKeySuffix = replaceStorageUriKeySuffix;
exports.resolveManifestAssetStorageFileHash = resolveManifestAssetStorageFileHash;
exports.resolveManifestAssetStorageUri = resolveManifestAssetStorageUri;
