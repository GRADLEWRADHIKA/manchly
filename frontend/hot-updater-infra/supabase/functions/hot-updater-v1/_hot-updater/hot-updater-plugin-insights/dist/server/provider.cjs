const require_contract = require("./contract.cjs");
const require_errors = require("./errors.cjs");
const require_eventInput = require("./eventInput.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/provider.ts
const DEFAULT_PAGE_LIMIT = 50;
const MAX_PAGE_LIMIT = 100;
const MAX_EVENT_ID_LENGTH = 1024;
const MAX_IDENTITY_LENGTH = 255;
const MAX_CURSOR_LENGTH = 8192;
const HOUR_MS = 36e5;
const DAY_MS = 24 * HOUR_MS;
const WINDOW_MS = {
	"24h": 864e5,
	"7d": 6048e5,
	"30d": 2592e6
};
/**
* The longest receipt range, `[sinceMs, beforeReceivedAtMs)`, of a global or
* bundle event list, and the range one covers without `sinceMs`: raw events
* are listed inside a time range, as analytics products list them. It is a
* duration, so a range that ends mid-day touches 91 UTC days. Installation
* history is one index range and reads back to `sinceMs`.
*/
const EVENT_LIST_RANGE_MS = 2160 * HOUR_MS;
const isRecord = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const requireString = (value, label, maximumLength) => {
	if (typeof value !== "string" || value.length === 0 || value.length > maximumLength || new TextDecoder("utf-8", { ignoreBOM: true }).decode(new TextEncoder().encode(value)) !== value) throw new require_errors.InsightsBadRequestError(`Invalid ${label}.`);
	return value;
};
const requireTimestamp = (value, label) => {
	if (!Number.isSafeInteger(value) || Number(value) < 0) throw new require_errors.InsightsBadRequestError(`Invalid ${label}.`);
	return Number(value);
};
const readLimit = (value) => {
	const limit = value ?? DEFAULT_PAGE_LIMIT;
	if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) throw new require_errors.InsightsBadRequestError("Invalid page limit.");
	return limit;
};
const encodeBase64Url = (value) => {
	const bytes = new TextEncoder().encode(value);
	let binary = "";
	for (const byte of bytes) binary += String.fromCharCode(byte);
	return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
};
const decodeBase64Url = (value) => {
	if (value.length === 0 || value.length > MAX_CURSOR_LENGTH) throw new require_errors.InsightsBadRequestError("Invalid Insights cursor.");
	try {
		const base64 = value.replaceAll("-", "+").replaceAll("_", "/");
		const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
		const binary = atob(padded);
		const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
		return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
	} catch {
		throw new require_errors.InsightsBadRequestError("Invalid Insights cursor.");
	}
};
const encodeCursor = (value) => encodeBase64Url(JSON.stringify(value));
const decodeCursor = (value) => {
	try {
		return JSON.parse(decodeBase64Url(value));
	} catch (error) {
		if (error instanceof require_errors.InsightsBadRequestError) throw error;
		throw new require_errors.InsightsBadRequestError("Invalid Insights cursor.");
	}
};
const readScope = (input) => {
	if (input.platform !== "ios" && input.platform !== "android") throw new require_errors.InsightsBadRequestError("Invalid Insights platform.");
	return {
		platform: input.platform,
		channel: requireString(input.channel, "channel", MAX_EVENT_ID_LENGTH)
	};
};
const bundleFilter = (input) => {
	const scope = readScope(input);
	const bundleId = requireString(input.bundleId, "bundle ID", MAX_EVENT_ID_LENGTH);
	switch (input.outcome) {
		case "downloaded": return {
			...scope,
			type: "UPDATE_DOWNLOADED",
			toBundleId: bundleId
		};
		case "applied": return {
			...scope,
			type: "UPDATE_APPLIED",
			toBundleId: bundleId
		};
		case "recovered": return {
			...scope,
			type: "RECOVERED",
			fromBundleId: bundleId
		};
		case "failed": return {
			...scope,
			type: "UPDATE_FAILED",
			toBundleId: bundleId
		};
		default: throw new require_errors.InsightsBadRequestError("Invalid Insights outcome.");
	}
};
const sameFilter = (left, right) => {
	if (!isRecord(left) || left.kind !== right.kind) return false;
	switch (right.kind) {
		case "all": return true;
		case "installationMovement": return left.installId === right.installId;
		case "bundle": return left.platform === right.platform && left.channel === right.channel && left.type === right.type && (right.type === "RECOVERED" ? left.fromBundleId === right.fromBundleId : left.toBundleId === right.toBundleId);
	}
};
const readEventCursor = (value, filter) => {
	const cursor = decodeCursor(value);
	if (!isRecord(cursor) || cursor.version !== 2 || cursor.kind !== "events" || !isRecord(cursor.filter) || !isRecord(cursor.after)) throw new require_errors.InsightsBadRequestError("Invalid Insights cursor.");
	if (!sameFilter(cursor.filter, filter)) throw new require_errors.InsightsBadRequestError("Insights cursor does not match the requested events.");
	if (typeof cursor.after.id !== "string" || !(0, _hot_updater_plugin_core.isUUIDv7)(cursor.after.id)) throw new require_errors.InsightsBadRequestError("Invalid Insights event cursor ID.");
	return {
		after: {
			id: cursor.after.id,
			receivedAtMs: requireTimestamp(cursor.after.receivedAtMs, "event cursor")
		},
		beforeReceivedAtMs: requireTimestamp(cursor.beforeReceivedAtMs, "event cutoff"),
		kind: "events",
		sinceMs: requireTimestamp(cursor.sinceMs, "event start"),
		filter,
		version: 2
	};
};
const readUserInstallationCursor = (value, userId) => {
	const cursor = decodeCursor(value);
	if (!isRecord(cursor) || cursor.version !== 1 || cursor.kind !== "user-installations" || cursor.userId !== userId) throw new require_errors.InsightsBadRequestError("Insights cursor does not match the requested user ID.");
	return {
		afterInstallId: requireString(cursor.afterInstallId, "installation cursor", MAX_IDENTITY_LENGTH),
		kind: "user-installations",
		userId,
		version: 1
	};
};
const compareEventNewest = (left, right) => right.received_at_ms - left.received_at_ms || require_contract.compareInsightsText(right.id, left.id);
const isAfterEventCursor = (row, after) => row.received_at_ms < after.receivedAtMs || row.received_at_ms === after.receivedAtMs && require_contract.compareInsightsText(row.id, after.id) < 0;
const assertEventRows = (rows, input) => {
	if (rows.length > input.limit) throw new Error("Insights database returned too many event rows.");
	for (let index = 0; index < rows.length; index += 1) {
		const row = rows[index];
		const previous = rows[index - 1];
		if (!row || typeof row.id !== "string" || !(0, _hot_updater_plugin_core.isUUIDv7)(row.id) || !Number.isSafeInteger(row.received_at_ms) || row.received_at_ms >= input.beforeReceivedAtMs || row.received_at_ms < input.sinceMs || previous !== void 0 && compareEventNewest(previous, row) >= 0 || input.after !== void 0 && !isAfterEventCursor(row, input.after) || input.filter.kind === "installationMovement" && (row.install_id !== input.filter.installId || !require_contract.isInsightsMovementEvent(row)) || input.filter.kind === "bundle" && (row.platform !== input.filter.platform || row.channel !== input.filter.channel || row.type !== input.filter.type || (input.filter.type === "RECOVERED" ? row.from_bundle_id !== input.filter.fromBundleId : row.to_bundle_id !== input.filter.toBundleId))) throw new Error("Insights database returned invalid event rows.");
	}
};
/** An `UPDATE_FAILED` row's failure, as the event lists show it. */
const toFailure = (failure) => ({
	stage: failure.stage,
	reason: failure.reason,
	...failure.error_message === void 0 ? {} : { errorMessage: failure.error_message },
	...failure.error_stack === void 0 ? {} : { errorStack: failure.error_stack },
	...failure.resource === void 0 ? {} : { resource: failure.resource },
	...failure.http_status === void 0 ? {} : { httpStatus: failure.http_status },
	...failure.transport === void 0 ? {} : { transport: failure.transport },
	...failure.origin_code === void 0 ? {} : { originCode: failure.origin_code }
});
/** What a row's metadata adds for its type: a failure or a delivery. */
const eventDetails = ({ type, metadata }) => ({
	...metadata.http_response !== void 0 ? { httpResponse: {
		resource: metadata.http_response.resource,
		path: metadata.http_response.path,
		status: metadata.http_response.status,
		body: metadata.http_response.body,
		bodyTruncated: metadata.http_response.body_truncated,
		receivedAtMs: metadata.http_response.received_at_ms
	} } : {},
	...type === "UPDATE_FAILED" && metadata.failure !== void 0 ? { failure: toFailure(metadata.failure) } : {},
	...type === "UPDATE_DOWNLOADED" && metadata.delivery !== void 0 ? { delivery: metadata.delivery } : {},
	...type === "UPDATE_DOWNLOADED" && metadata.patch_fallback === true ? { patchFallback: true } : {},
	...type === "UNCHANGED" && metadata.change !== void 0 ? { change: {
		kinds: metadata.change.kinds,
		...metadata.change.previous === null ? {} : { previous: {
			bundleId: metadata.change.previous.bundle_id,
			releaseId: metadata.change.previous.release_id,
			appVersion: metadata.change.previous.app_version,
			channel: metadata.change.previous.channel,
			...metadata.change.previous.min_bundle_id === void 0 ? {} : { minBundleId: metadata.change.previous.min_bundle_id }
		} }
	} } : {},
	...metadata.late === true ? { late: true } : {},
	...metadata.implied_download === true ? { impliedDownload: true } : {}
});
const toEventHistoryRow = (row) => ({
	...row.to_release_id == null ? {} : { toReleaseId: row.to_release_id },
	...row.metadata.sdk_version == null ? {} : { sdkVersion: row.metadata.sdk_version },
	...row.metadata.min_bundle_id === void 0 ? {} : { minBundleId: row.metadata.min_bundle_id },
	appVersion: row.app_version,
	channel: row.channel,
	cohort: row.metadata.cohort,
	fromBundleId: row.from_bundle_id,
	id: row.id,
	installId: row.install_id,
	platform: row.platform,
	receivedAtMs: row.received_at_ms,
	toBundleId: row.to_bundle_id,
	type: row.type,
	userId: row.user_id,
	...eventDetails(row)
});
const toInstallationRow = (row) => ({
	...eventDetails(row).httpResponse ? { httpResponse: eventDetails(row).httpResponse } : {},
	...row.metadata.min_bundle_id === void 0 ? {} : { minBundleId: row.metadata.min_bundle_id },
	appVersion: row.app_version,
	channel: row.channel,
	cohort: row.metadata.cohort,
	installId: row.install_id,
	lastKnownBundleId: row.type === "UPDATE_DOWNLOADED" ? row.from_bundle_id : row.to_bundle_id,
	pendingBundleId: row.type === "UPDATE_DOWNLOADED" ? row.to_bundle_id : null,
	pendingReleaseId: row.type === "UPDATE_DOWNLOADED" ? row.to_release_id : null,
	latestStatus: row.type,
	platform: row.platform,
	receivedAtMs: row.received_at_ms,
	userId: row.user_id
});
/**
* Where a list without `sinceMs` starts: 90 days before its cutoff for the
* global and bundle lists, at the first event for installation history.
*/
const defaultEventStart = (filter, beforeReceivedAtMs) => filter.kind === "installationMovement" ? 0 : Math.max(0, beforeReceivedAtMs - EVENT_LIST_RANGE_MS);
/** Whether a cursor's row lies inside the list's range. */
const isInsideBounds = ({ after }, bounds) => after.receivedAtMs >= bounds.sinceMs && after.receivedAtMs < bounds.beforeReceivedAtMs;
/** A page's range: its cursor's, which the request may repeat but not change. */
const readEventBounds = (input, cursor, filter) => {
	const beforeReceivedAtMs = cursor?.beforeReceivedAtMs ?? (input.beforeReceivedAtMs === void 0 ? Date.now() : requireTimestamp(input.beforeReceivedAtMs, "event cutoff"));
	if (cursor !== void 0 && input.beforeReceivedAtMs !== void 0 && input.beforeReceivedAtMs !== beforeReceivedAtMs) throw new require_errors.InsightsBadRequestError("Insights cursor does not match the requested event cutoff.");
	const sinceMs = cursor?.sinceMs ?? (input.sinceMs === void 0 ? defaultEventStart(filter, beforeReceivedAtMs) : requireTimestamp(input.sinceMs, "event start"));
	const bounds = {
		beforeReceivedAtMs,
		sinceMs
	};
	if (sinceMs > beforeReceivedAtMs || input.sinceMs !== void 0 && input.sinceMs !== sinceMs || cursor !== void 0 && !isInsideBounds(cursor, bounds)) throw new require_errors.InsightsBadRequestError("Insights cursor or range does not match the requested event start.");
	if (filter.kind !== "installationMovement" && beforeReceivedAtMs - sinceMs > 7776e6) throw new require_errors.InsightsBadRequestError("Insights event lists cover at most 90 days: send a sinceMs no more than 90 days before beforeReceivedAtMs.");
	return bounds;
};
const pageEventRows = async (model, input, filter, map) => {
	const limit = readLimit(input.limit);
	const cursor = input.cursor === void 0 ? void 0 : readEventCursor(input.cursor, filter);
	const bounds = readEventBounds(input, cursor, filter);
	const query = {
		filter,
		...bounds,
		...cursor === void 0 ? {} : { after: cursor.after },
		limit
	};
	const rows = await model.listEvents(query);
	assertEventRows(rows, query);
	const last = rows.at(-1);
	return {
		beforeReceivedAtMs: bounds.beforeReceivedAtMs,
		data: rows.map(map),
		nextCursor: rows.length === limit && last ? encodeCursor({
			after: {
				id: last.id,
				receivedAtMs: last.received_at_ms
			},
			...bounds,
			kind: "events",
			filter,
			version: 2
		}) : null
	};
};
const assertInstallationRows = (rows, input) => {
	if (rows.length > input.limit) throw new Error("Insights database returned too many installation rows.");
	for (let index = 0; index < rows.length; index += 1) {
		const row = rows[index];
		const previous = rows[index - 1];
		if (!row || row.user_id !== input.userId || input.afterInstallId !== void 0 && require_contract.compareInsightsText(row.install_id, input.afterInstallId) <= 0 || previous !== void 0 && require_contract.compareInsightsText(previous.install_id, row.install_id) >= 0) throw new Error("Insights database returned invalid installation rows.");
	}
};
const createInsightsProvider = (model) => Object.freeze({
	async appendBundleEvent(input) {
		const event = require_eventInput.createBundleEventRow(input);
		await model.recordEvent({ event });
	},
	listEvents(input) {
		const filter = input.bundle === void 0 ? { kind: "all" } : {
			kind: "bundle",
			...bundleFilter(input.bundle)
		};
		return pageEventRows(model, input, filter, toEventHistoryRow);
	},
	async listInstallationEvents(input) {
		if ("bundle" in input && input.bundle !== void 0) throw new require_errors.InsightsBadRequestError("Installation movement queries cannot include a bundle filter.");
		const installId = requireString(input.installId, "install ID", MAX_IDENTITY_LENGTH);
		return pageEventRows(model, input, {
			kind: "installationMovement",
			installId
		}, (row) => toEventHistoryRow(row));
	},
	async getInstallation({ installId }) {
		const normalizedInstallId = requireString(installId, "install ID", MAX_IDENTITY_LENGTH);
		const rows = await model.findLatestEvents({ installId: normalizedInstallId });
		const row = rows[0] ?? null;
		if (rows.length > 1 || row !== null && row.install_id !== normalizedInstallId) throw new Error("Insights database returned an invalid installation.");
		return row === null ? null : toInstallationRow(row);
	},
	async pageInstallationsByCurrentUserId(input) {
		const userId = requireString(input.userId, "user ID", MAX_IDENTITY_LENGTH);
		const limit = readLimit(input.limit);
		const cursor = input.cursor === void 0 ? void 0 : readUserInstallationCursor(input.cursor, userId);
		const databaseInput = {
			userId,
			...cursor === void 0 ? {} : { afterInstallId: cursor.afterInstallId },
			limit
		};
		const rows = await model.findLatestEvents(databaseInput);
		assertInstallationRows(rows, databaseInput);
		const last = rows.at(-1);
		return {
			data: rows.map(toInstallationRow),
			nextCursor: rows.length === limit && last ? encodeCursor({
				afterInstallId: last.install_id,
				kind: "user-installations",
				userId,
				version: 1
			}) : null
		};
	},
	async getReportingOverview(input) {
		const scope = readScope(input);
		const { window } = input;
		if (!Object.hasOwn(WINDOW_MS, window)) throw new require_errors.InsightsBadRequestError("Invalid reporting installation window.");
		const now = Date.now();
		const beforeReceivedAtMs = now - now % HOUR_MS + (now % HOUR_MS === 0 ? 0 : HOUR_MS);
		const reach = Math.max(0, beforeReceivedAtMs - WINDOW_MS[window]);
		const sinceMs = reach - reach % DAY_MS;
		const measure = async (count) => {
			const value = await count;
			if (!Number.isSafeInteger(value) || value < 0) throw new Error("Insights database returned an invalid count.");
			return {
				count: value,
				measuredAtMs: Date.now()
			};
		};
		const bundleId = input.bundleId === void 0 ? void 0 : requireString(input.bundleId, "bundle ID", MAX_EVENT_ID_LENGTH);
		const reporting = measure(model.countLatestEvents({
			...scope,
			sinceMs
		}));
		if (bundleId === void 0) return {
			...scope,
			window,
			sinceMs,
			beforeReceivedAtMs,
			reportingInstallations: await reporting
		};
		const countOutcome = (outcome) => measure(model.countEvents({
			filter: bundleFilter({
				...scope,
				bundleId,
				outcome
			}),
			sinceMs,
			beforeReceivedAtMs
		}));
		const [reportingInstallations, bundleInstallations, downloadedReports, appliedReports, recoveredReports, failedReports] = await Promise.all([
			reporting,
			measure(model.countLatestEvents({
				...scope,
				sinceMs,
				bundle: [{
					field: "from_bundle_id",
					value: bundleId,
					types: ["UPDATE_DOWNLOADED"]
				}, {
					field: "to_bundle_id",
					value: bundleId,
					types: [
						"UNCHANGED",
						"UPDATE_APPLIED",
						"RECOVERED"
					]
				}]
			})),
			countOutcome("downloaded"),
			countOutcome("applied"),
			countOutcome("recovered"),
			countOutcome("failed")
		]);
		return {
			...scope,
			window,
			sinceMs,
			beforeReceivedAtMs,
			reportingInstallations,
			bundle: {
				bundleId,
				reportingInstallations: bundleInstallations,
				downloadedReports,
				appliedReports,
				recoveredReports,
				failedReports
			}
		};
	}
});
//#endregion
exports.EVENT_LIST_RANGE_MS = EVENT_LIST_RANGE_MS;
exports.createInsightsProvider = createInsightsProvider;
