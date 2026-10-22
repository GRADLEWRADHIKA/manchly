//#region src/bundleStorageLayout.d.ts
declare const BUNDLE_STORAGE_PREFIX = "bundles";
declare const createBundleStorageKey: (bundleId: string, ...relativePaths: string[]) => string;
declare const getBundleArchiveStorageUri: ({ manifestStorageUri, bundleId }: {
  manifestStorageUri: string;
  bundleId: string;
}) => string;
declare const createStorageRootUriWithPath: (storageUri: string, bundleId: string, relativePath: string) => string;
//#endregion
export { BUNDLE_STORAGE_PREFIX, createBundleStorageKey, createStorageRootUriWithPath, getBundleArchiveStorageUri };