const require_errors = require("./errors.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/eventInput.ts
const MAX_EVENT_STRING_LENGTH = 1024;
const MAX_IDENTITY_LENGTH = 255;
const EVENT_BODY_MAX_BYTES = 16384;
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requireStringField(payload, key) {
	const value = payload[key];
	if (typeof value !== "string" || value.length === 0 || value.length > MAX_EVENT_STRING_LENGTH || new TextDecoder("utf-8", { ignoreBOM: true }).decode(new TextEncoder().encode(value)) !== value) throw new require_errors.InsightsBadRequestError(`Invalid event field: ${key}`);
	return value;
}
function requireNullableStringField(payload, key) {
	if (payload[key] === null) return null;
	return requireStringField(payload, key);
}
function requireIdentityField(payload, key) {
	const value = requireStringField(payload, key);
	if (value.length > MAX_IDENTITY_LENGTH) throw new require_errors.InsightsBadRequestError(`Invalid event field: ${key}`);
	return value;
}
/**
* The report's idempotency key, when the client sends one: it creates the
* UUIDv7 once and repeats it on every retry of that report.
*/
function readEventId(payload) {
	const value = payload.eventId;
	if (value === void 0) return void 0;
	if (!(0, _hot_updater_plugin_core.isUUIDv7)(value)) throw new require_errors.InsightsBadRequestError("Invalid event field: eventId");
	return value;
}
/**
* The native build's built-in bundle ID: a bundle ID's length at most, and
* left out when it is missing or malformed, so the report still records.
*/
const readMinBundleId = (value) => typeof value === "string" && value.length > 0 && value.length <= 36 ? value : null;
/** One value of an open set: any other value reads as `unknown`. */
const oneOf = (values, value) => values.includes(value) ? value : "unknown";
const STAGES = [
	"check",
	"download",
	"install"
];
const REASONS = [
	"network",
	"http",
	"invalid_response",
	"hash_mismatch",
	"signature",
	"patch",
	"extract",
	"storage"
];
const RESOURCES = [
	"catalog",
	"artifact",
	"manifest",
	"file",
	"patch",
	"archive"
];
const TRANSPORTS = [
	"timeout",
	"dns",
	"tls",
	"connection",
	"offline",
	"cancelled"
];
const DELIVERIES = [
	"patch",
	"manifest",
	"archive"
];
/** A storage error code: letters, digits, and `._-`. */
const CODE = /^[A-Za-z0-9._-]{1,64}$/;
const readCode = (value) => typeof value === "string" && CODE.test(value) ? value : void 0;
const readMetadata = (payload) => isRecord(payload.metadata) ? payload.metadata : {};
/**
* What an UPDATE_FAILED report says failed. It never refuses the report: an
* unknown value of a set reads as `unknown`, a missing or malformed failure
* as an unknown stage and reason, and a malformed optional field is left out,
* as is a null one.
*/
function readFailure(value) {
	const failure = isRecord(value) ? value : {};
	const httpStatus = failure.httpStatus;
	const originCode = readCode(failure.originCode);
	const errorMessage = typeof failure.errorMessage === "string" && failure.errorMessage.length <= 2048 ? failure.errorMessage : void 0;
	const errorStack = typeof failure.errorStack === "string" && failure.errorStack.length <= 4096 ? failure.errorStack : void 0;
	return {
		stage: oneOf(STAGES, failure.stage),
		reason: oneOf(REASONS, failure.reason),
		...failure.resource == null ? {} : { resource: oneOf(RESOURCES, failure.resource) },
		...Number.isSafeInteger(httpStatus) && httpStatus >= 100 && httpStatus <= 599 ? { httpStatus } : {},
		...failure.transport == null ? {} : { transport: oneOf(TRANSPORTS, failure.transport) },
		...originCode === void 0 ? {} : { originCode },
		...errorMessage === void 0 ? {} : { errorMessage },
		...errorStack === void 0 ? {} : { errorStack }
	};
}
function readHttpResponse(value) {
	if (!isRecord(value) || value.resource !== "catalog" && value.resource !== "artifact" || typeof value.path !== "string" || value.path.length > 1024 || !Number.isSafeInteger(value.status) || value.status < 100 || value.status > 599 || value.body !== null && (typeof value.body !== "string" || new TextEncoder().encode(JSON.stringify(value.body)).byteLength > 4096) || typeof value.bodyTruncated !== "boolean" || !Number.isSafeInteger(value.receivedAtMs) || value.receivedAtMs < 0) throw new require_errors.InsightsBadRequestError("Invalid HTTP response details");
	return {
		resource: value.resource,
		path: value.path,
		status: value.status,
		body: value.body,
		bodyTruncated: value.bodyTruncated,
		receivedAtMs: value.receivedAtMs
	};
}
async function readBoundedText(request) {
	const contentLength = request.headers.get("content-length");
	const declaredByteLength = Number(contentLength);
	if (contentLength !== null && Number.isSafeInteger(declaredByteLength) && declaredByteLength > 16384) throw new require_errors.InsightsPayloadTooLargeError(EVENT_BODY_MAX_BYTES);
	if (request.body === null) return "";
	const reader = request.body.getReader();
	const decoder = new TextDecoder();
	let byteLength = 0;
	let text = "";
	while (true) {
		const result = await reader.read();
		if (result.done) break;
		byteLength += result.value.byteLength;
		if (byteLength > 16384) {
			await reader.cancel();
			throw new require_errors.InsightsPayloadTooLargeError(EVENT_BODY_MAX_BYTES);
		}
		text += decoder.decode(result.value, { stream: true });
	}
	return text + decoder.decode();
}
async function parseJson(request) {
	const text = await readBoundedText(request);
	try {
		return JSON.parse(text);
	} catch (error) {
		if (error instanceof SyntaxError) throw new require_errors.InsightsBadRequestError("Invalid event payload");
		throw error;
	}
}
function requireEvent(payload) {
	if (!isRecord(payload)) throw new require_errors.InsightsBadRequestError("Invalid event payload");
	const platform = requireStringField(payload, "platform");
	if (platform !== "ios" && platform !== "android") throw new require_errors.InsightsBadRequestError("Invalid event field: platform");
	const eventId = readEventId(payload);
	const metadata = readMetadata(payload);
	const httpMetadata = metadata.httpResponse === void 0 ? {} : { httpResponse: readHttpResponse(metadata.httpResponse) };
	const base = {
		...metadata.httpResponse === void 0 ? {} : { metadata: httpMetadata },
		...eventId === void 0 ? {} : { eventId },
		installId: requireIdentityField(payload, "installId"),
		toBundleId: requireStringField(payload, "toBundleId"),
		...payload.userId === void 0 ? {} : { userId: requireIdentityField(payload, "userId") },
		platform,
		appVersion: requireStringField(payload, "appVersion"),
		channel: requireStringField(payload, "channel"),
		cohort: requireStringField(payload, "cohort"),
		fingerprintHash: requireNullableStringField(payload, "fingerprintHash"),
		sdkVersion: payload.sdkVersion === void 0 ? null : requireNullableStringField(payload, "sdkVersion"),
		minBundleId: readMinBundleId(payload.minBundleId),
		fromReleaseId: requireNullableStringField(payload, "fromReleaseId"),
		toReleaseId: requireNullableStringField(payload, "toReleaseId")
	};
	const type = requireStringField(payload, "type");
	const movement = () => {
		const updateStrategy = requireStringField(payload, "updateStrategy");
		if (updateStrategy !== "fingerprint" && updateStrategy !== "appVersion") throw new require_errors.InsightsBadRequestError("Invalid event field: updateStrategy");
		return {
			...base,
			fromBundleId: requireStringField(payload, "fromBundleId"),
			updateStrategy
		};
	};
	switch (type) {
		case "UPDATE_DOWNLOADED": {
			const delivery = metadata.delivery;
			const read = {
				...httpMetadata,
				...delivery == null ? {} : { delivery: oneOf(DELIVERIES, delivery) },
				...metadata.patchFallback === true ? { patchFallback: true } : {}
			};
			return {
				...movement(),
				type,
				...Object.keys(read).length === 0 ? {} : { metadata: read }
			};
		}
		case "UPDATE_APPLIED":
		case "RECOVERED": return {
			...movement(),
			type
		};
		case "UPDATE_FAILED": return {
			...movement(),
			type,
			metadata: {
				...httpMetadata,
				failure: readFailure(metadata.failure)
			}
		};
		case "UNCHANGED":
			if (payload.fromBundleId !== null || payload.updateStrategy !== null) throw new require_errors.InsightsBadRequestError("Invalid unchanged event shape");
			return {
				...base,
				type,
				fromBundleId: null,
				updateStrategy: null
			};
		default: throw new require_errors.InsightsBadRequestError("Invalid event field: type");
	}
}
async function parseBundleEventRequest(request) {
	return requireEvent(await parseJson(request));
}
function createBundleEventRow(input) {
	input = requireEvent(input);
	const base = {
		app_version: input.appVersion,
		channel: input.channel,
		from_release_id: input.fromReleaseId,
		id: input.eventId ?? (0, _hot_updater_plugin_core.createUUIDv7)(),
		install_id: input.installId,
		platform: input.platform,
		received_at_ms: Date.now(),
		to_bundle_id: input.toBundleId,
		to_release_id: input.toReleaseId,
		user_id: input.userId ?? null
	};
	const response = input.metadata?.httpResponse;
	const metadata = {
		...response ? { http_response: {
			resource: response.resource,
			path: response.path,
			status: response.status,
			body: response.body,
			body_truncated: response.bodyTruncated,
			received_at_ms: response.receivedAtMs
		} } : {},
		cohort: input.cohort,
		fingerprint_hash: input.fingerprintHash,
		sdk_version: input.sdkVersion ?? null,
		...input.minBundleId ? { min_bundle_id: input.minBundleId } : {},
		update_strategy: input.updateStrategy
	};
	switch (input.type) {
		case "UPDATE_DOWNLOADED": {
			const { delivery, patchFallback } = input.metadata ?? {};
			return {
				...base,
				from_bundle_id: input.fromBundleId,
				type: input.type,
				metadata: {
					...metadata,
					...delivery === void 0 ? {} : { delivery },
					...patchFallback ? { patch_fallback: true } : {}
				}
			};
		}
		case "UPDATE_APPLIED":
		case "RECOVERED": return {
			...base,
			from_bundle_id: input.fromBundleId,
			type: input.type,
			metadata
		};
		case "UPDATE_FAILED": {
			const { failure } = input.metadata;
			return {
				...base,
				from_bundle_id: input.fromBundleId,
				type: input.type,
				metadata: {
					...metadata,
					failure: {
						stage: failure.stage,
						reason: failure.reason,
						...failure.errorMessage === void 0 ? {} : { error_message: failure.errorMessage },
						...failure.errorStack === void 0 ? {} : { error_stack: failure.errorStack },
						...failure.resource === void 0 ? {} : { resource: failure.resource },
						...failure.httpStatus === void 0 ? {} : { http_status: failure.httpStatus },
						...failure.transport === void 0 ? {} : { transport: failure.transport },
						...failure.originCode === void 0 ? {} : { origin_code: failure.originCode }
					}
				}
			};
		}
		case "UNCHANGED": return {
			...base,
			from_bundle_id: null,
			type: input.type,
			metadata
		};
	}
}
//#endregion
exports.EVENT_BODY_MAX_BYTES = EVENT_BODY_MAX_BYTES;
exports.createBundleEventRow = createBundleEventRow;
exports.parseBundleEventRequest = parseBundleEventRequest;
