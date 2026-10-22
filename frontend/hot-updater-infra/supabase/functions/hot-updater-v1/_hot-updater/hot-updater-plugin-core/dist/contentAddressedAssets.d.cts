//#region src/contentAddressedAssets.d.ts
declare const CONTENT_ADDRESSED_ASSET_PREFIX = "assets";
declare const isContentAddressedAssetFileHash: (value: unknown) => value is string;
declare const getContentAddressedAssetStoragePath: ({ assetPath, fileHash }: {
  assetPath: string;
  fileHash: string;
}) => string;
//#endregion
export { CONTENT_ADDRESSED_ASSET_PREFIX, getContentAddressedAssetStoragePath, isContentAddressedAssetFileHash };