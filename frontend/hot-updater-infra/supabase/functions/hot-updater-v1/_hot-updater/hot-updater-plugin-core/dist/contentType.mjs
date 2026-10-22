import mime from "mime";
//#region src/contentType.ts
function getContentType(filePath) {
	return mime.getType(filePath) ?? "application/octet-stream";
}
//#endregion
export { getContentType };
