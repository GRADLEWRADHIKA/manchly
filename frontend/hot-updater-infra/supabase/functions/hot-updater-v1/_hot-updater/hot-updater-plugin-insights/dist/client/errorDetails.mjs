import { getUtf8ByteLength } from "@hot-updater/protocol";
//#region src/client/errorDetails.ts
/** Bound the JSON wire size without rewriting the error text or splitting Unicode. */
const boundedText = (text, maxBytes) => {
	if (getUtf8ByteLength(JSON.stringify(text)) <= maxBytes) return text;
	let result = "";
	let bytes = 2 + getUtf8ByteLength("…");
	for (const character of text) {
		bytes += getUtf8ByteLength(JSON.stringify(character)) - 2;
		if (bytes > maxBytes) break;
		result += character;
	}
	return `${result}…`;
};
/** Error properties are not enumerable, so JSON.stringify(error) would lose them. */
const readErrorDetails = (error) => {
	if (error == null) return {};
	const object = typeof error === "object" ? error : null;
	let message;
	if (object && "message" in object && typeof object.message === "string") message = object.message;
	else if (typeof error === "string") message = error;
	else try {
		message = JSON.stringify(error) ?? String(error);
	} catch {
		message = String(error);
	}
	const stack = object && "stack" in object && typeof object.stack === "string" ? object.stack : void 0;
	return {
		...message ? { errorMessage: boundedText(message, 2048) } : {},
		...stack ? { errorStack: boundedText(stack, 4096) } : {}
	};
};
//#endregion
export { boundedText, readErrorDetails };
