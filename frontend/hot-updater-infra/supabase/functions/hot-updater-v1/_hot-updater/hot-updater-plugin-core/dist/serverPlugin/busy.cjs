const require_errors = require("./errors.cjs");
//#region src/serverPlugin/busy.ts
/** Error names the AWS SDKs give a throttled request, as their retry strategy classifies them. */
const THROTTLING_NAMES = /* @__PURE__ */ new Set([
	"ProvisionedThroughputExceededException",
	"RequestLimitExceeded",
	"RequestThrottled",
	"RequestThrottledException",
	"SlowDown",
	"ThrottledException",
	"Throttling",
	"ThrottlingException",
	"TooManyRequestsException"
]);
/** gRPC's RESOURCE_EXHAUSTED, the status Firestore throttles a request with. */
const RESOURCE_EXHAUSTED = 8;
/**
* Whether the database is busy rather than broken, so the same request can
* succeed later: a transaction ran out of retries, or the backend throttled
* a request. Writes already retry transient failures, throttled ones
* included, until the budget runs out. A throttled read throws the backend's
* own error, so it is recognized by what the backends call it: a name the
* AWS SDKs retry as throttling, HTTP 429, or gRPC's RESOURCE_EXHAUSTED.
*/
const isDatabaseBusyError = (error) => {
	if (error instanceof require_errors.DatabaseConflictError) return true;
	if (typeof error !== "object" || error === null) return false;
	const { name, code, message, status, statusCode, $metadata } = error;
	return typeof name === "string" && THROTTLING_NAMES.has(name) || [
		status,
		statusCode,
		$metadata?.httpStatusCode
	].includes(429) || code === RESOURCE_EXHAUSTED && typeof message === "string" && message.includes("RESOURCE_EXHAUSTED");
};
//#endregion
exports.isDatabaseBusyError = isDatabaseBusyError;
