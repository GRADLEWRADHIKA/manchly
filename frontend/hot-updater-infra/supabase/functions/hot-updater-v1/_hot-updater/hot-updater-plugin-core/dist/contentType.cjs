const require_runtime = require("./_virtual/_rolldown/runtime.cjs");
let mime = require("mime");
mime = require_runtime.__toESM(mime, 1);
//#region src/contentType.ts
function getContentType(filePath) {
	return mime.default.getType(filePath) ?? "application/octet-stream";
}
//#endregion
exports.getContentType = getContentType;
