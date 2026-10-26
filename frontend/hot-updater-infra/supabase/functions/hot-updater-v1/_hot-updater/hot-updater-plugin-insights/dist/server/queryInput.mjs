import { InsightsBadRequestError } from "./errors.mjs";
//#region src/server/queryInput.ts
const MAX_PAGE_LIMIT = 100;
const MAX_IDENTITY_LENGTH = 255;
const MAX_CURSOR_LENGTH = 8192;
const readSingle = (url, key) => {
	const values = url.searchParams.getAll(key);
	if (values.length > 1) throw new InsightsBadRequestError(`Duplicate '${key}' query parameter.`);
	return values[0];
};
const readPageLimit = (url) => {
	const value = readSingle(url, "limit");
	if (value === void 0) return void 0;
	const limit = Number(value);
	if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_LIMIT) throw new InsightsBadRequestError("Invalid 'limit' query parameter.");
	return limit;
};
const readCursor = (url) => {
	const cursor = readSingle(url, "cursor");
	if (cursor !== void 0 && (cursor.length === 0 || cursor.length > MAX_CURSOR_LENGTH)) throw new InsightsBadRequestError("Invalid 'cursor' query parameter.");
	return cursor;
};
const readId = (url, key, maximumLength = MAX_IDENTITY_LENGTH) => {
	const value = readSingle(url, key);
	if (value === void 0 || value.length === 0 || value.length > maximumLength) throw new InsightsBadRequestError(`Invalid '${key}' query parameter.`);
	return value;
};
const readTimestamp = (url, key) => {
	const raw = readSingle(url, key);
	if (raw === void 0) return void 0;
	const value = Number(raw);
	if (!raw.length || !Number.isSafeInteger(value) || value < 0) throw new InsightsBadRequestError(`Invalid '${key}' query parameter.`);
	return value;
};
const readScope = (url) => {
	const platform = readSingle(url, "platform");
	if (platform !== "ios" && platform !== "android") throw new InsightsBadRequestError("Invalid 'platform' query parameter.");
	return {
		platform,
		channel: readId(url, "channel", 1024)
	};
};
const parseEventPageInput = (request) => {
	const url = new URL(request.url);
	const bundleFields = [
		"bundleId",
		"outcome",
		"platform",
		"channel"
	];
	let bundle;
	if (bundleFields.some((key) => url.searchParams.has(key))) {
		const outcome = readSingle(url, "outcome");
		if (outcome !== "downloaded" && outcome !== "applied" && outcome !== "recovered" && outcome !== "failed") throw new InsightsBadRequestError("Invalid 'outcome' query parameter.");
		bundle = {
			...readScope(url),
			bundleId: readId(url, "bundleId", 1024),
			outcome
		};
	}
	return {
		beforeReceivedAtMs: readTimestamp(url, "beforeReceivedAtMs"),
		sinceMs: readTimestamp(url, "sinceMs"),
		cursor: readCursor(url),
		limit: readPageLimit(url),
		...bundle === void 0 ? {} : { bundle }
	};
};
const parseUserInstallationPageInput = (request) => {
	const url = new URL(request.url);
	const cursor = readCursor(url);
	const limit = readPageLimit(url);
	return {
		userId: readId(url, "userId"),
		...cursor === void 0 ? {} : { cursor },
		...limit === void 0 ? {} : { limit }
	};
};
const parseReportingOverviewInput = (request) => {
	const url = new URL(request.url);
	const window = readSingle(url, "window") ?? "30d";
	if (window !== "24h" && window !== "7d" && window !== "30d") throw new InsightsBadRequestError("Invalid 'window' query parameter.");
	const bundleId = readSingle(url, "bundleId");
	return {
		...readScope(url),
		window,
		...bundleId === void 0 ? {} : { bundleId: readId(url, "bundleId", 1024) }
	};
};
//#endregion
export { parseEventPageInput, parseReportingOverviewInput, parseUserInstallationPageInput };
