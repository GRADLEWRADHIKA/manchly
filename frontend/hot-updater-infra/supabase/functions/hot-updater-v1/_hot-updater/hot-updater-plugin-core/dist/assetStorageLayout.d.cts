//#region src/assetStorageLayout.d.ts
declare const isBrotliManifestAssetPath: (assetPath: string) => boolean;
declare const getManifestAssetDownloadPath: (assetPath: string) => string;
declare const createStorageUriWithRelativePath: ({ baseStorageUri, relativePath }: {
  baseStorageUri: string;
  relativePath: string;
}) => string;
declare const replaceStorageUriKeySuffix: ({ storageUri, keySuffix, replacement }: {
  storageUri: string;
  keySuffix: string;
  replacement: string;
}) => string;
declare const resolveManifestAssetStorageFileHash: ({ downloadFileHash, fileHash }: {
  downloadFileHash?: unknown;
  fileHash: string;
}) => string;
declare const getManifestAssetStoragePath: ({ assetPath, downloadFileHash, fileHash }: {
  assetPath: string;
  downloadFileHash?: unknown;
  fileHash: string;
}) => string;
declare const resolveManifestAssetStorageUri: ({ assetBaseStorageUri, assetPath, downloadFileHash, fileHash }: {
  assetBaseStorageUri: string;
  assetPath: string;
  downloadFileHash?: unknown;
  fileHash: string;
}) => string;
//#endregion
export { createStorageUriWithRelativePath, getManifestAssetDownloadPath, getManifestAssetStoragePath, isBrotliManifestAssetPath, replaceStorageUriKeySuffix, resolveManifestAssetStorageFileHash, resolveManifestAssetStorageUri };