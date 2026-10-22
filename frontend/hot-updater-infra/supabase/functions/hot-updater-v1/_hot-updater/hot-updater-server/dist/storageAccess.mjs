//#region src/storageAccess.ts
/** A URL devices download from, which only an absolute HTTP(S) URL can be. */
const assertRemoteUrl = (value) => {
	let protocol;
	try {
		protocol = new URL(value).protocol;
	} catch {}
	if (protocol !== "http:" && protocol !== "https:") throw new Error("Storage getDownloadUrl must resolve to an absolute HTTP(S) URL.");
	return value;
};
const getStorageProtocol = (storageUri) => new URL(storageUri).protocol.replace(":", "");
const isRemoteUrlProtocol = (protocol) => protocol === "http" || protocol === "https";
/**
* Reads and download URLs over the server's storage, for the URIs of its
* protocol; an HTTP(S) URI is used as it is.
*/
const createStorageAccess = (storageAdapter) => {
	const findStorage = (protocol) => storageAdapter.protocol === protocol ? storageAdapter : void 0;
	const readStorageResponse = async (storageUri) => {
		const protocol = getStorageProtocol(storageUri);
		const storage = findStorage(protocol);
		if (storage) {
			if (!storage.get) return null;
			return (await storage.get({ storageUri })).response;
		}
		if (isRemoteUrlProtocol(protocol)) {
			const response = await fetch(storageUri);
			return response.ok ? response : null;
		}
		throw new Error(`No storage adapter for protocol: ${protocol}`);
	};
	const resolveFileUrl = async (storageUri) => {
		if (!storageUri) return null;
		const protocol = getStorageProtocol(storageUri);
		const storage = findStorage(protocol);
		if (!storage) {
			if (isRemoteUrlProtocol(protocol)) return storageUri;
			throw new Error(`No storage adapter for protocol: ${protocol}`);
		}
		if (!storage.getDownloadUrl) return null;
		const { url: downloadUrl } = await storage.getDownloadUrl({ storageUri });
		return assertRemoteUrl(downloadUrl);
	};
	const readStorageText = async (storageUri) => {
		return (await readStorageResponse(storageUri))?.text() ?? null;
	};
	return {
		readStorageText,
		resolveFileUrl
	};
};
//#endregion
export { createStorageAccess };
