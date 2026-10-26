import { replaceStorageUriKeySuffix } from "./assetStorageLayout.mjs";
//#region src/bundleStorageLayout.ts
const BUNDLE_STORAGE_PREFIX = "bundles";
const createBundleStorageKey = (bundleId, ...relativePaths) => [
	BUNDLE_STORAGE_PREFIX,
	bundleId,
	...relativePaths
].filter(Boolean).join("/");
const getBundleArchiveStorageUri = ({ manifestStorageUri, bundleId }) => replaceStorageUriKeySuffix({
	storageUri: manifestStorageUri,
	keySuffix: createBundleStorageKey(bundleId, "manifest.json"),
	replacement: createBundleStorageKey(bundleId, "bundle.tar.br")
});
const createStorageRootUriWithPath = (storageUri, bundleId, relativePath) => {
	const storageUrl = new URL(storageUri);
	const segments = storageUrl.pathname.split("/").filter(Boolean);
	const bundleIndex = segments.lastIndexOf(bundleId);
	if (bundleIndex < 1 || segments[bundleIndex - 1] !== "bundles") throw new Error(`Storage URI does not contain canonical bundle path: ${BUNDLE_STORAGE_PREFIX}/${bundleId}`);
	const rootSegments = segments.slice(0, bundleIndex - 1);
	const relativeSegments = relativePath.split("/").filter(Boolean).map((segment) => encodeURIComponent(segment));
	storageUrl.pathname = `/${[...rootSegments, ...relativeSegments].join("/")}`;
	return storageUrl.toString();
};
//#endregion
export { BUNDLE_STORAGE_PREFIX, createBundleStorageKey, createStorageRootUriWithPath, getBundleArchiveStorageUri };
