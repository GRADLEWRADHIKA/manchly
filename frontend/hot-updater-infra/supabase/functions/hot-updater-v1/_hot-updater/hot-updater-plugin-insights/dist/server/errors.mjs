//#region src/server/errors.ts
/**
* What Insights' API throws for an input it refuses, such as an unknown
* event field or a malformed cursor; its routes answer 400 for it.
*/
var InsightsBadRequestError = class extends Error {
	name = "InsightsBadRequestError";
};
var InsightsPayloadTooLargeError = class extends Error {
	maximumBytes;
	name = "InsightsPayloadTooLargeError";
	constructor(maximumBytes) {
		super(`Event payload exceeds ${maximumBytes} bytes`);
		this.maximumBytes = maximumBytes;
	}
};
//#endregion
export { InsightsBadRequestError, InsightsPayloadTooLargeError };
