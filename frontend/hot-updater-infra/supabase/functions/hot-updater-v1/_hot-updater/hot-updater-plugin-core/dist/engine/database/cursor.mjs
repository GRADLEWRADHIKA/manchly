import { DatabaseCursorError } from "../../serverPlugin/errors.mjs";
import { isKeyValue } from "../../database/values.mjs";
//#region src/engine/database/cursor.ts
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const toBase64Url = (text) => {
	let binary = "";
	for (const byte of encoder.encode(text)) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
const fromBase64Url = (value) => {
	const binary = atob(value.replaceAll("-", "+").replaceAll("_", "/"));
	return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
};
/** A stable 32-bit FNV-1a hash of the text's UTF-8 bytes. */
const fnv1a = (text) => {
	let hash = 2166136261;
	for (const byte of encoder.encode(text)) hash = Math.imul(hash ^ byte, 16777619) >>> 0;
	return hash;
};
/** A hash of the request's identity; a cursor only resumes the same read. */
const cursorScope = (parts) => fnv1a(JSON.stringify(parts)).toString(36);
const encodeCursor = (scope, after) => toBase64Url(JSON.stringify([scope, after]));
/** The order tuple a cursor resumes after; rejects a cursor from another read. */
const decodeCursor = (scope, cursor) => {
	let decoded;
	try {
		decoded = JSON.parse(fromBase64Url(cursor));
	} catch {
		decoded = void 0;
	}
	const [from, after] = Array.isArray(decoded) ? decoded : [];
	if (typeof from !== "string" || !Array.isArray(after) || !after.every(isKeyValue)) throw new DatabaseCursorError("The cursor is malformed.");
	if (from !== scope) throw new DatabaseCursorError("The cursor belongs to a read with another model, index, filter, order, or range.");
	return after;
};
//#endregion
export { DatabaseCursorError, cursorScope, decodeCursor, encodeCursor, fnv1a };
