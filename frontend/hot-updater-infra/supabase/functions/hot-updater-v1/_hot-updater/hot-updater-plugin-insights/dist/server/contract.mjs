import { isRecord, validateBundleEventFields } from "./eventRow.mjs";
import { bundleRefOfFilter, bundleRefsOf } from "./schema.mjs";
import { DatabaseAdapterInputError, isUUIDv7 } from "@hot-updater/plugin-core";
//#region src/server/contract.ts
const encoder = new TextEncoder();
/** Exact UTF-8 byte ordering, without case folding or Unicode normalization. */
const compareInsightsText = (left, right) => {
	const a = encoder.encode(left);
	const b = encoder.encode(right);
	for (let index = 0; index < Math.min(a.length, b.length); index += 1) if (a[index] !== b[index]) return a[index] - b[index];
	return a.length - b.length;
};
const isWellFormedText = (value) => {
	for (const character of value) {
		const point = character.codePointAt(0);
		if (point >= 55296 && point <= 57343) return false;
	}
	return true;
};
const isIdentity = (value) => typeof value === "string" && value.length > 0 && value.length <= 255 && isWellFormedText(value);
const isText = (value) => typeof value === "string" && value.length > 0 && isWellFormedText(value);
const isTimestamp = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const isLimit = (value) => isTimestamp(value) && value >= 1 && value <= 101;
const hasOnlyKeys = (value, keys) => Object.keys(value).every((key) => keys.includes(key));
const hasScope = (value) => (value.platform === "ios" || value.platform === "android") && isText(value.channel);
const isBundleFilter = (value, withKind = false) => {
	if (!isRecord(value) || !hasScope(value)) return false;
	const keys = [
		"platform",
		"channel",
		"type",
		...withKind ? ["kind"] : []
	];
	return value.type === "RECOVERED" ? isText(value.fromBundleId) && hasOnlyKeys(value, [...keys, "fromBundleId"]) : (value.type === "UPDATE_DOWNLOADED" || value.type === "UPDATE_APPLIED" || value.type === "UPDATE_FAILED" || value.type === "UNCHANGED") && isText(value.toBundleId) && hasOnlyKeys(value, [...keys, "toBundleId"]);
};
const isEventFilter = (value) => {
	if (!isRecord(value)) return false;
	if (value.kind === "all") return hasOnlyKeys(value, ["kind"]);
	if (value.kind === "installationMovement") return isIdentity(value.installId) && hasOnlyKeys(value, ["kind", "installId"]);
	return value.kind === "bundle" && isBundleFilter(value, true);
};
const validateRow = (model, row, result = false) => {
	try {
		validateBundleEventFields(row);
		if (!isRecord(row) || typeof row.id !== "string" || !isUUIDv7(row.id) || [...Object.values(row), ...isRecord(row.metadata) ? Object.values(row.metadata) : []].some((value) => typeof value === "string" && !isWellFormedText(value))) throw new DatabaseAdapterInputError("invalid-data");
	} catch (error) {
		if (result) throw new DatabaseAdapterInputError("invalid-result");
		throw error;
	}
};
/** Throws `invalid-data` unless `row` is a complete, well-formed bundle event row. */
const assertBundleEventRow = (row) => validateRow("bundle_events", row);
/**
* Downloads, applies, recoveries, failed updates, and the UNCHANGED rows
* kept for a change belong in installation history.
*/
const isInsightsMovementEvent = (event) => event.type === "UPDATE_DOWNLOADED" || event.type === "UPDATE_APPLIED" || event.type === "RECOVERED" || event.type === "UPDATE_FAILED" || event.type === "UNCHANGED";
const matchesInsightsEventFilter = (event, filter) => {
	if (filter.kind === "all") return true;
	if (filter.kind === "installationMovement") return event.install_id === filter.installId && isInsightsMovementEvent(event);
	return event.type === filter.type && event.platform === filter.platform && event.channel === filter.channel && bundleRefsOf(event).includes(bundleRefOfFilter(filter));
};
const invalidQuery = () => {
	throw new DatabaseAdapterInputError("invalid-query");
};
const invalidResult = () => {
	throw new DatabaseAdapterInputError("invalid-result");
};
const validateCount = (count) => isTimestamp(count) ? count : invalidResult();
const isTimeRange = (value) => isRecord(value) && hasOnlyKeys(value, ["start", "end"]) && isTimestamp(value.start) && isTimestamp(value.end) && value.start < value.end;
const isReleaseReference = (value) => isRecord(value) && hasOnlyKeys(value, [
	"releaseId",
	"platform",
	"channel"
]) && isIdentity(value.releaseId) && hasScope(value);
const validateAggregateResult = (value) => {
	const result = isRecord(value) ? value : invalidResult();
	if (!isTimestamp(result.measuredAtMs)) invalidResult();
	const coverage = result.coverage;
	if (!isRecord(coverage) || coverage.kind !== "complete" && coverage.kind !== "partial" || coverage.sinceMs !== null && !isTimestamp(coverage.sinceMs)) invalidResult();
};
/** Validate custom and bundled providers at the same public boundary. */
const createValidatedInsightsModel = (model) => ({
	async recordEvent(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, ["event"])) throw new DatabaseAdapterInputError("invalid-data");
		validateRow("bundle_events", input.event);
		await model.recordEvent(input);
	},
	async listEvents(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, [
			"filter",
			"sinceMs",
			"beforeReceivedAtMs",
			"after",
			"limit"
		]) || !isEventFilter(input.filter) || !isLimit(input.limit) || !isTimestamp(input.beforeReceivedAtMs) || input.sinceMs !== void 0 && !isTimestamp(input.sinceMs)) invalidQuery();
		const sinceMs = input.sinceMs ?? 0;
		if (sinceMs > input.beforeReceivedAtMs || input.after !== void 0 && (!isRecord(input.after) || !hasOnlyKeys(input.after, ["receivedAtMs", "id"]) || !isTimestamp(input.after.receivedAtMs) || typeof input.after.id !== "string" || !isUUIDv7(input.after.id) || input.after.receivedAtMs < sinceMs || input.after.receivedAtMs >= input.beforeReceivedAtMs)) invalidQuery();
		const rows = await model.listEvents(input);
		if (!Array.isArray(rows) || rows.length > input.limit) invalidResult();
		let previous = input.after;
		for (const row of rows) {
			validateRow("bundle_events", row, true);
			if (row.received_at_ms < sinceMs || row.received_at_ms >= input.beforeReceivedAtMs || !matchesInsightsEventFilter(row, input.filter) || previous !== void 0 && (row.received_at_ms > previous.receivedAtMs || row.received_at_ms === previous.receivedAtMs && row.id >= previous.id)) invalidResult();
			previous = {
				receivedAtMs: row.received_at_ms,
				id: row.id
			};
		}
		return rows;
	},
	async findLatestEvents(input) {
		if (!isRecord(input)) invalidQuery();
		if ("installId" in input) {
			if (!hasOnlyKeys(input, ["installId"]) || !isIdentity(input.installId)) invalidQuery();
		} else if (!hasOnlyKeys(input, [
			"userId",
			"afterInstallId",
			"limit"
		]) || !isIdentity(input.userId) || !isLimit(input.limit) || input.afterInstallId !== void 0 && !isIdentity(input.afterInstallId)) invalidQuery();
		const rows = await model.findLatestEvents(input);
		if (!Array.isArray(rows) || rows.length > ("installId" in input ? 1 : input.limit)) invalidResult();
		let previous = "installId" in input ? void 0 : input.afterInstallId;
		for (const row of rows) {
			validateRow("bundle_events", row, true);
			if ("installId" in input ? row.install_id !== input.installId : row.user_id !== input.userId || previous !== void 0 && compareInsightsText(row.install_id, previous) <= 0) invalidResult();
			previous = row.install_id;
		}
		return rows;
	},
	async countLatestEvents(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, [
			"platform",
			"channel",
			"sinceMs",
			"bundle"
		]) || !hasScope(input) || !isTimestamp(input.sinceMs) || input.bundle !== void 0 && (!Array.isArray(input.bundle) || input.bundle.length < 1 || input.bundle.length > 2 || input.bundle.some((bundle) => !isRecord(bundle) || !hasOnlyKeys(bundle, [
			"field",
			"value",
			"types"
		]) || bundle.field !== "from_bundle_id" && bundle.field !== "to_bundle_id" || !isText(bundle.value) || !Array.isArray(bundle.types) || bundle.types.length === 0 || bundle.types.some((type) => ![
			"UNCHANGED",
			"UPDATE_DOWNLOADED",
			"UPDATE_APPLIED",
			"RECOVERED"
		].includes(type))))) invalidQuery();
		return validateCount(await model.countLatestEvents(input));
	},
	async countEvents(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, [
			"filter",
			"sinceMs",
			"beforeReceivedAtMs"
		]) || !isBundleFilter(input.filter) || !isTimestamp(input.sinceMs) || !isTimestamp(input.beforeReceivedAtMs) || input.sinceMs > input.beforeReceivedAtMs) invalidQuery();
		return validateCount(await model.countEvents(input));
	},
	async countEventSeries(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, [
			"filter",
			"timeRange",
			"intervalMs"
		]) || !isBundleFilter(input.filter) || !isTimeRange(input.timeRange) || !isTimestamp(input.intervalMs)) invalidQuery();
		const { start, end } = input.timeRange;
		const { intervalMs } = input;
		if (intervalMs === 0 || intervalMs % 36e5 !== 0 || start % 36e5 !== 0 || (end - start) % intervalMs !== 0 || end - start > 7776e6) invalidQuery();
		const points = await model.countEventSeries(input);
		if (!Array.isArray(points) || points.length !== (end - start) / intervalMs || points.some((point, index) => !isRecord(point) || !hasOnlyKeys(point, ["startMs", "events"]) || point.startMs !== start + index * intervalMs || !isTimestamp(point.events))) invalidResult();
		return points;
	},
	async getReleaseActivity(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, ["releases"]) || !Array.isArray(input.releases) || input.releases.length < 1 || input.releases.length > 100 || !input.releases.every(isReleaseReference)) invalidQuery();
		const result = await model.getReleaseActivity(input);
		if (!isRecord(result) || !isTimestamp(result.measuredAtMs) || !Array.isArray(result.data) || result.data.some((item) => !isRecord(item) || !isReleaseReference(item.release) || !isRecord(item.metrics) || !isTimestamp(item.metrics.downloads) || !isTimestamp(item.metrics.applies) || !isTimestamp(item.metrics.failedLaunches))) invalidResult();
		return result;
	},
	async getAppUsage(input) {
		if (!isRecord(input) || !hasOnlyKeys(input, [
			"channel",
			"platform",
			"appVersion",
			"timeRange",
			"intervalMs"
		]) || !isText(input.channel) || ![
			"all",
			"ios",
			"android"
		].includes(input.platform) || input.appVersion !== void 0 && !isText(input.appVersion) || !isTimeRange(input.timeRange) || !isTimestamp(input.intervalMs) || input.intervalMs < 36e5) invalidQuery();
		const result = await model.getAppUsage(input);
		validateAggregateResult(result);
		if (!isTimestamp(result.activeInstallations) || !Array.isArray(result.points) || !Array.isArray(result.appVersions) || !Array.isArray(result.versions) || !Array.isArray(result.platforms) || !Array.isArray(result.bundleDistribution)) invalidResult();
		return result;
	}
});
//#endregion
export { assertBundleEventRow, compareInsightsText, createValidatedInsightsModel, isInsightsMovementEvent, matchesInsightsEventFilter };
