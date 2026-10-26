let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/eventRow.ts
const CHANGE_KINDS = /* @__PURE__ */ new Set([
	"first_seen",
	"bundle",
	"release",
	"app_version",
	"channel",
	"native_build"
]);
const isBundleEventChange = (value) => (0, _hot_updater_plugin_core.isDatabaseJsonObject)(value) && Array.isArray(value.kinds) && value.kinds.length > 0 && value.kinds.every((kind) => CHANGE_KINDS.has(kind)) && (value.previous === null || (0, _hot_updater_plugin_core.isDatabaseJsonObject)(value.previous) && typeof value.previous.bundle_id === "string" && (value.previous.release_id === null || typeof value.previous.release_id === "string") && typeof value.previous.app_version === "string" && typeof value.previous.channel === "string" && isOptional(value.previous, "min_bundle_id", isString));
const isOptional = (value, key, valid) => !Object.hasOwn(value, key) || valid(value[key]);
const isString = (value) => typeof value === "string";
const isDatabaseHttpResponse = (value) => (0, _hot_updater_plugin_core.isDatabaseJsonObject)(value) && (value.resource === "catalog" || value.resource === "artifact") && isString(value.path) && Number.isSafeInteger(value.status) && (value.body === null || isString(value.body)) && typeof value.body_truncated === "boolean" && Number.isSafeInteger(value.received_at_ms);
/** An `UPDATE_FAILED` report's stored failure: a stage and a reason, and what else the client knew. */
const isDatabaseBundleEventFailure = (value) => (0, _hot_updater_plugin_core.isDatabaseJsonObject)(value) && isString(value.stage) && isString(value.reason) && isOptional(value, "resource", isString) && isOptional(value, "http_status", (status) => Number.isSafeInteger(status)) && isOptional(value, "transport", isString) && isOptional(value, "origin_code", isString) && isOptional(value, "error_message", isString) && isOptional(value, "error_stack", isString);
const isDatabaseBundleEventMetadata = (value) => (0, _hot_updater_plugin_core.isDatabaseJsonObject)(value) && typeof value.cohort === "string" && (value.update_strategy === null || value.update_strategy === "fingerprint" || value.update_strategy === "appVersion") && (value.fingerprint_hash === null || typeof value.fingerprint_hash === "string") && (value.sdk_version === null || typeof value.sdk_version === "string") && isOptional(value, "min_bundle_id", isString) && isOptional(value, "failure", isDatabaseBundleEventFailure) && isOptional(value, "http_response", isDatabaseHttpResponse) && isOptional(value, "delivery", isString) && isOptional(value, "patch_fallback", (flag) => typeof flag === "boolean") && isOptional(value, "change", isBundleEventChange) && isOptional(value, "late", (flag) => flag === true) && isOptional(value, "implied_download", (flag) => flag === true);
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
/**
* The built-in bundle a report says its installation runs: the running
* bundle, which a download leaves at its source, when it is the native
* build's built-in bundle, whatever Release selected it. Null for any other
* bundle, and for a report without the build's built-in bundle ID.
*/
const runningBuiltinBundleId = (row) => {
	const running = row.type === "UPDATE_DOWNLOADED" ? row.from_bundle_id : row.to_bundle_id;
	const builtin = isRecord(row.metadata) ? row.metadata.min_bundle_id : null;
	return typeof builtin === "string" && running === builtin ? builtin : null;
};
const isIdentity = (value) => typeof value === "string" && value.length > 0 && value.length <= 255;
const isTextOrNull = (value) => value === null || typeof value === "string";
/** Each bundle event field and what it holds. */
const BUNDLE_EVENT_FIELDS = {
	id: (value) => typeof value === "string",
	type: (value) => value === "UPDATE_DOWNLOADED" || value === "UPDATE_APPLIED" || value === "RECOVERED" || value === "UPDATE_FAILED" || value === "UNCHANGED",
	install_id: isIdentity,
	user_id: (value) => value === null || isIdentity(value),
	from_bundle_id: isTextOrNull,
	from_release_id: isTextOrNull,
	to_release_id: isTextOrNull,
	to_bundle_id: (value) => typeof value === "string",
	platform: (value) => value === "ios" || value === "android",
	app_version: (value) => typeof value === "string",
	channel: (value) => typeof value === "string",
	metadata: isDatabaseBundleEventMetadata,
	received_at_ms: (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0
};
const hasMetadata = (row, key) => isRecord(row.metadata) && Object.hasOwn(row.metadata, key);
const updateStrategyOf = (row) => isRecord(row.metadata) ? row.metadata.update_strategy : void 0;
/**
* A movement, or a failed update, names the bundle it left and how the
* device updates, and a failed update says what failed; an unchanged report
* names neither.
*/
const hasEventInvariants = (row) => (row.type === "UPDATE_DOWNLOADED" || row.type === "UPDATE_APPLIED" || row.type === "RECOVERED" || row.type === "UPDATE_FAILED") && typeof row.from_bundle_id === "string" && (updateStrategyOf(row) === "fingerprint" || updateStrategyOf(row) === "appVersion") && (row.type !== "UPDATE_FAILED" || isRecord(row.metadata) && isRecord(row.metadata.failure)) && !hasMetadata(row, "change") && (!hasMetadata(row, "late") || row.type === "UPDATE_DOWNLOADED" || row.type === "UPDATE_APPLIED") && (!hasMetadata(row, "implied_download") || row.type === "UPDATE_APPLIED" || row.type === "RECOVERED") || row.type === "UNCHANGED" && !hasMetadata(row, "late") && row.from_bundle_id === null && updateStrategyOf(row) === null;
/**
* Throws unless `row` has exactly the bundle event fields, each of its type,
* and the invariants of its event type: `invalid-field` for an unknown field,
* `invalid-data` for anything else.
*/
const validateBundleEventFields = (row) => {
	if (!isRecord(row)) throw new _hot_updater_plugin_core.DatabaseAdapterInputError("invalid-data");
	for (const field of Object.keys(row)) if (!Object.hasOwn(BUNDLE_EVENT_FIELDS, field)) throw new _hot_updater_plugin_core.DatabaseAdapterInputError("invalid-field");
	for (const [field, valid] of Object.entries(BUNDLE_EVENT_FIELDS)) if (!Object.hasOwn(row, field) || !valid(row[field])) throw new _hot_updater_plugin_core.DatabaseAdapterInputError("invalid-data");
	if (!hasEventInvariants(row)) throw new _hot_updater_plugin_core.DatabaseAdapterInputError("invalid-data");
};
//#endregion
exports.isDatabaseBundleEventMetadata = isDatabaseBundleEventMetadata;
exports.isRecord = isRecord;
exports.runningBuiltinBundleId = runningBuiltinBundleId;
exports.validateBundleEventFields = validateBundleEventFields;
