import { getContentAddressedAssetStoragePath, isContentAddressedAssetFileHash } from "./contentAddressedAssets.mjs";
import { createStorageKeyBuilder } from "./createStorageKeyBuilder.mjs";
import { createStorageUri, parseStorageUri } from "./parseStorageUri.mjs";
//#region src/assetStorageLayout.ts
const isBrotliManifestAssetPath = (assetPath) => /(^|\/)index\.[^/]+\.bundle$/.test(assetPath.replace(/\\/g, "/"));
const getManifestAssetDownloadPath = (assetPath) => isBrotliManifestAssetPath(assetPath) ? `${assetPath}.br` : assetPath;
const createStorageUriWithRelativePath = ({ baseStorageUri, relativePath }) => {
	const protocol = new URL(baseStorageUri).protocol.replace(":", "");
	const parsed = parseStorageUri(baseStorageUri, protocol);
	const childKey = createStorageKeyBuilder(void 0)(relativePath);
	if (!childKey) throw new Error("Relative storage key must not be empty.");
	return createStorageUri({
		protocol: parsed.protocol,
		bucket: parsed.bucket,
		key: createStorageKeyBuilder(parsed.key)(childKey)
	});
};
const replaceStorageUriKeySuffix = ({ storageUri, keySuffix, replacement }) => {
	const protocol = new URL(storageUri).protocol.replace(":", "");
	const parsed = parseStorageUri(storageUri, protocol);
	const normalizedSuffix = createStorageKeyBuilder(void 0)(keySuffix);
	const normalizedReplacement = createStorageKeyBuilder(void 0)(replacement);
	if (!normalizedSuffix || !normalizedReplacement) throw new Error("Storage URI key suffix and replacement must not be empty.");
	const keySegments = parsed.key.split("/");
	const suffixSegments = normalizedSuffix.split("/");
	const suffixOffset = keySegments.length - suffixSegments.length;
	if (suffixOffset < 0 || suffixSegments.some((segment, index) => keySegments[suffixOffset + index] !== segment)) throw new Error("Storage URI key does not end with the expected suffix.");
	const prefix = keySegments.slice(0, suffixOffset).join("/");
	return createStorageUri({
		protocol: parsed.protocol,
		bucket: parsed.bucket,
		key: createStorageKeyBuilder(prefix)(normalizedReplacement)
	});
};
const resolveManifestAssetStorageFileHash = ({ downloadFileHash, fileHash }) => isContentAddressedAssetFileHash(downloadFileHash) ? downloadFileHash : fileHash;
const getManifestAssetStoragePath = ({ assetPath, downloadFileHash, fileHash }) => getContentAddressedAssetStoragePath({
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
export { createStorageUriWithRelativePath, getManifestAssetDownloadPath, getManifestAssetStoragePath, isBrotliManifestAssetPath, replaceStorageUriKeySuffix, resolveManifestAssetStorageFileHash, resolveManifestAssetStorageUri };
