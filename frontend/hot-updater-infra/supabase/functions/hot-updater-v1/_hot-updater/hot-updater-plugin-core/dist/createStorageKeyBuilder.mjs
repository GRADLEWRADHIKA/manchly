//#region src/createStorageKeyBuilder.ts
const normalizeStorageKeyParts = (values) => {
	if (values.some((value) => value.includes("\\"))) throw new Error("Storage keys must use '/' as the hierarchy separator.");
	const segments = values.flatMap((value) => value.split("/").filter(Boolean));
	if (segments.some((segment) => segment === "." || segment === "..")) throw new Error("Storage key segments must not be '.' or '..'.");
	return segments;
};
const createStorageKeyBuilder = (basePath) => {
	const baseSegments = normalizeStorageKeyParts([basePath ?? ""]);
	return (...args) => [...baseSegments, ...normalizeStorageKeyParts(args)].join("/");
};
//#endregion
export { createStorageKeyBuilder };
