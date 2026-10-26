import { DAILY_EVENTS, DAY_MS, HOUR_MS, bundleRefOfFilter } from "./schema.mjs";
import "./provider.mjs";
import { PAIR_FIELD, bundlePairKey, insightsIdentity } from "./recordEvent.mjs";
import { DatabaseAdapterInputError, compareUtf8, countDistinct, mergeDistinct } from "@hot-updater/plugin-core";
//#region src/server/reads.ts
const PAGE = 500;
const hourFloor = (ms) => ms - ms % HOUR_MS;
const hourCeil = (ms) => hourFloor(ms + HOUR_MS - 1);
const dayFloor = (ms) => ms - ms % DAY_MS;
const dayCeil = (ms) => dayFloor(ms + DAY_MS - 1);
/** Every page of one read, in order. */
const drain = async (read) => {
	const rows = [];
	let cursor;
	do {
		const page = await read(cursor === void 0 ? {} : { cursor });
		rows.push(...page.rows);
		cursor = page.next;
	} while (cursor !== void 0);
	return rows;
};
const EVENT_FIELDS = [
	"id",
	"type",
	"install_id",
	"user_id",
	"from_release_id",
	"from_bundle_id",
	"to_release_id",
	"to_bundle_id",
	"platform",
	"app_version",
	"channel",
	"metadata",
	"received_at_ms"
];
/** A stored event or head, as the event row it holds. */
const toEvent = (row) => Object.fromEntries(EVENT_FIELDS.map((field) => [field, row[field]]));
const scopeOf = (filter) => ({
	platform: filter.platform,
	channel: filter.channel,
	type: filter.type,
	bundle_ref: bundleRefOfFilter(filter)
});
/** One UTC day of a global or bundle list, newest first. */
const eventsOfDay = (db, filter, day, range, limit) => filter.kind === "all" ? db.findMany("bundle_events", {
	index: "byDay",
	where: { day },
	range,
	order: "desc",
	limit
}) : db.findMany("bundle_events", {
	index: "byBundle",
	where: {
		...scopeOf(filter),
		day
	},
	range,
	order: "desc",
	limit
});
/**
* The newest UTC day before `day`, and not before `since`'s, that holds an
* event the list matches, from one outcome row: the global list's per-day
* count, or the bundle filter's own hourly one.
*/
const newestDayBelow = async (db, filter, day, since) => {
	const counted = filter.kind === "all" ? {
		where: DAILY_EVENTS,
		from: dayFloor(since)
	} : {
		where: scopeOf(filter),
		from: hourFloor(since)
	};
	const [newest] = (await db.findAggregates("insights_outcomes", {
		index: "byRef",
		where: counted.where,
		range: {
			gte: counted.from,
			lt: day
		},
		order: "desc",
		limit: 1
	})).rows;
	return newest === void 0 ? void 0 : dayFloor(newest.bucket_start_ms);
};
/**
* Newest first over [since, before), after the cursor. The global and bundle
* lists cover at most 90 × 24 hours, however many UTC days that touches, and
* reject a longer range instead of cutting it short. They read one query per
* UTC day that holds a matching event: a day that holds none is read once,
* then one outcome row names the newest day below it that does, so a gap of
* any length costs two reads.
*/
const listEvents = async (db, input) => {
	const since = input.sinceMs ?? 0;
	const range = {
		gte: since,
		lt: input.after === void 0 ? input.beforeReceivedAtMs : [input.after.receivedAtMs, input.after.id]
	};
	const { filter, limit } = input;
	if (filter.kind === "installationMovement") return (await db.findMany("bundle_events", {
		index: "movementsByInstall",
		where: { movement_install_id: filter.installId },
		range,
		order: "desc",
		limit
	})).rows.map(toEvent);
	if (input.beforeReceivedAtMs - since > 7776e6) throw new DatabaseAdapterInputError("invalid-query");
	const rows = [];
	const bottom = dayFloor(since);
	let day = dayFloor(input.after?.receivedAtMs ?? input.beforeReceivedAtMs - 1);
	while (day !== void 0 && day >= bottom && rows.length < limit) {
		const page = await eventsOfDay(db, filter, day, range, limit - rows.length);
		rows.push(...page.rows.map(toEvent));
		day = page.rows.length > 0 ? day - DAY_MS : day > bottom ? await newestDayBelow(db, filter, day, since) : void 0;
	}
	return rows;
};
/** One point read for an installation; a user's installations in binary install id order. */
const findLatestEvents = async (db, input) => {
	if ("installId" in input) {
		const head = await db.findOne("bundle_event_heads", { install_id: input.installId });
		return head === null ? [] : [toEvent(head)];
	}
	return (await db.findMany("bundle_event_heads", {
		index: "byUser",
		where: { user_id: input.userId },
		...input.afterInstallId === void 0 ? {} : { range: { gt: input.afterInstallId } },
		order: "asc",
		limit: input.limit
	})).rows.map(toEvent);
};
/** Raw events of one bundle filter over [from, to), which spans at most two partial hours. */
const countRaw = async (db, filter, from, to) => {
	let total = 0;
	for (let day = dayFloor(from); from < to && day < to; day += DAY_MS) {
		const rows = await drain((page) => db.findMany("bundle_events", {
			index: "byBundle",
			where: {
				...scopeOf(filter),
				day
			},
			range: {
				gte: from,
				lt: to
			},
			limit: PAGE,
			...page
		}));
		total += rows.length;
	}
	return total;
};
/**
* Whole hours from outcome counters; the partial hours at either edge from
* raw events. A download filter's whole hours count the downloads a launch
* or crash implied too, which its raw events do not hold.
*/
const countEvents = async (db, input) => {
	const { filter, sinceMs, beforeReceivedAtMs } = input;
	const start = hourCeil(sinceMs);
	const end = hourFloor(beforeReceivedAtMs);
	if (start >= end) return countRaw(db, filter, sinceMs, beforeReceivedAtMs);
	const hours = await drain((page) => db.findAggregates("insights_outcomes", {
		index: "byRef",
		where: scopeOf(filter),
		range: {
			gte: start,
			lt: end
		},
		limit: PAGE,
		...page
	}));
	return await countRaw(db, filter, sinceMs, start) + hours.reduce((sum, row) => sum + row.events, 0) + await countRaw(db, filter, end, beforeReceivedAtMs);
};
/**
* A bundle filter's stored events in each interval of whole hours, and for a
* download filter the downloads a launch or crash implied: one read of its
* hourly counts, every interval present.
*/
const countEventSeries = async (db, input) => {
	const { filter, intervalMs } = input;
	const { start, end } = input.timeRange;
	const events = Array.from({ length: (end - start) / intervalMs }, () => 0);
	const hours = await drain((page) => db.findAggregates("insights_outcomes", {
		index: "byRef",
		where: scopeOf(filter),
		range: {
			gte: start,
			lt: end
		},
		limit: PAGE,
		...page
	}));
	for (const row of hours) events[Math.floor((row.bucket_start_ms - start) / intervalMs)] += row.events;
	return events.map((count, index) => ({
		startMs: start + index * intervalMs,
		events: count
	}));
};
/** A bundle filter's distinct (field, value, type) predicates. */
const latestPredicates = (bundle) => {
	if (bundle === void 0) return void 0;
	return [...new Map(bundle.flatMap(({ field, value, types }) => types.map((type) => [JSON.stringify([
		field,
		value,
		type
	]), {
		field,
		value,
		type
	}]))).values()];
};
/**
* Latest events at or after `sinceMs`, a UTC day's start: the gauges count
* each installation in the UTC day of its latest event, so they answer whole
* days only, and a later start is rejected rather than rounded.
*/
const countLatestEvents = async (db, input) => {
	const { platform, channel, sinceMs: start } = input;
	if (start % 864e5 !== 0) throw new DatabaseAdapterInputError("invalid-query");
	const predicates = latestPredicates(input.bundle);
	let total = 0;
	if (predicates === void 0) {
		const rows = await drain((page) => db.findAggregates("insights_distribution", {
			index: "byScope",
			where: {
				channel,
				platform
			},
			range: { gte: start },
			limit: PAGE,
			...page
		}));
		total += rows.reduce((sum, row) => sum + row.latest_installations, 0);
	} else {
		const gauge = async (bundleField, bundleId, type) => {
			return (await drain((page) => db.findAggregates("insights_latest_by_bundle", {
				index: "byBundle",
				where: {
					platform,
					channel,
					bundle_field: bundleField,
					bundle_id: bundleId,
					type
				},
				range: { gte: start },
				limit: PAGE,
				...page
			}))).reduce((sum, row) => sum + row.installations, 0);
		};
		for (const { field, value, type } of predicates) total += await gauge(field, value, type);
		for (const from of predicates) {
			if (from.field !== "from_bundle_id") continue;
			for (const to of predicates) {
				if (to.field !== "to_bundle_id" || to.type !== from.type) continue;
				total -= await gauge(PAIR_FIELD, bundlePairKey(from.value, to.value), from.type);
			}
		}
	}
	return Math.max(0, total);
};
/** The oldest whole hour and UTC day that hourly and daily rows still hold. */
const retained = (now, { rawDays, dailyDays }) => ({
	hour: hourCeil(now - rawDays * DAY_MS),
	day: dayCeil(now - dailyDays * DAY_MS)
});
/**
* Whether the rows a window reads still hold all of it; an older start is
* partial from `oldest`, the first bucket its rows keep.
*/
const coverageOf = (start, oldest) => start >= oldest ? {
	kind: "complete",
	sinceMs: 0
} : {
	kind: "partial",
	sinceMs: oldest
};
/**
* Periods covering [start, end): whole UTC days when `days` and the window is
* over 48 hours, hours elsewhere. Hourly rows start at `hour`, the raw
* period ago, so with `days` an edge older than that reads its whole UTC day
* from the daily rows.
*/
const periodsOf = (range, days, hour) => {
	const start = days && range.start < hour ? dayFloor(range.start) : range.start;
	const end = days && range.end < hour ? dayCeil(range.end) : range.end;
	if (!days || end - start <= 1728e5 && start >= hour) return [{
		periodKind: "hour",
		start,
		end
	}];
	const first = Math.min(end, dayCeil(start));
	const last = Math.max(first, dayFloor(end));
	return [
		{
			periodKind: "hour",
			start,
			end: first
		},
		{
			periodKind: "day",
			start: first,
			end: last
		},
		{
			periodKind: "hour",
			start: last,
			end
		}
	].filter((period) => period.start < period.end);
};
/** The hourly and daily aggregates of counters, and of sketches. */
const COUNTERS = {
	hour: "insights_overview",
	day: "insights_overview_daily"
};
const SKETCHES = {
	hour: "insights_sketches",
	day: "insights_sketches_daily"
};
/** Every counter or sketch row of one identity over [start, end), mixing day and hour periods. */
const windowRows = async (db, models, parts, range, days, hour) => {
	const rows = [];
	for (const period of periodsOf(range, days, hour)) {
		const identity = insightsIdentity({
			...parts,
			periodKind: period.periodKind
		});
		rows.push(...await drain((page) => db.findAggregates(models[period.periodKind], {
			index: "window",
			where: { identity },
			range: {
				gte: period.start,
				lt: period.end
			},
			limit: PAGE,
			...page
		})));
	}
	return rows;
};
const counterRows = (...[db, ...args]) => windowRows(db, COUNTERS, ...args);
const sketchRows = (...[db, ...args]) => windowRows(db, SKETCHES, ...args);
const releaseParts = (release) => ({
	scopeKind: "release",
	releaseKind: "specific",
	releaseId: release.releaseId,
	channel: release.channel,
	platform: release.platform,
	appVersionKind: "all",
	appVersion: ""
});
/** A release's lifetime counters: one logical row at bucket 0. */
const lifetimeMetrics = async (db, release) => {
	const identity = insightsIdentity({
		...releaseParts(release),
		periodKind: "lifetime"
	});
	const [lifetime] = (await db.findAggregates("insights_overview_lifetime", {
		index: "window",
		where: { identity },
		range: {
			gte: 0,
			lte: 0
		},
		limit: PAGE
	})).rows;
	return {
		downloads: lifetime?.downloads ?? 0,
		applies: lifetime?.applies ?? 0,
		failedLaunches: lifetime?.failed_launches ?? 0
	};
};
/** A channel and platform's usage rows, of every app version or of one. */
const usageParts = (channel, platform, appVersion) => ({
	scopeKind: "usage",
	releaseKind: "all",
	releaseId: "",
	channel,
	platform,
	appVersionKind: appVersion === void 0 ? "all" : "specific",
	appVersion: appVersion ?? ""
});
/** Each release's lifetime counters, which are kept: one logical row apiece. */
const getReleaseActivity = async (db, input, now) => {
	const measuredAtMs = now();
	return {
		data: await Promise.all(input.releases.map(async (release) => ({
			release,
			metrics: await lifetimeMetrics(db, release)
		}))),
		measuredAtMs
	};
};
/**
* Entries with installations, most first. Batched gauges sum signed shard
* rows, so a version or platform everyone left can read 0, and is left out.
*/
const byInstallations = (values) => [...values].flatMap(([name, installations]) => installations > 0 ? [{
	name,
	installations
}] : []).sort((left, right) => right.installations - left.installations || left.name.localeCompare(right.name, "en", { numeric: true }));
const getAppUsage = async (db, input, now, retention) => {
	const { timeRange, intervalMs } = input;
	const at = now();
	const kept = retained(at, retention);
	const days = intervalMs % 864e5 === 0 && timeRange.start % 864e5 === 0;
	const reported = input.platform === "all" ? ["ios", "android"] : [input.platform];
	const usage = (await Promise.all(reported.map((platform) => sketchRows(db, usageParts(input.channel, platform, input.appVersion), timeRange, days, kept.hour)))).flat();
	const range = {
		gte: dayFloor(timeRange.start),
		lt: timeRange.end
	};
	const distribution = [];
	const builtinDistribution = [];
	for (const platform of reported) {
		distribution.push(...await drain((page) => input.appVersion === void 0 ? db.findAggregates("insights_distribution", {
			index: "byScope",
			where: {
				channel: input.channel,
				platform
			},
			range,
			limit: PAGE,
			...page
		}) : db.findAggregates("insights_distribution", {
			index: "byVersion",
			where: {
				channel: input.channel,
				platform,
				app_version: input.appVersion
			},
			range,
			limit: PAGE,
			...page
		})));
		builtinDistribution.push(...await drain((page) => input.appVersion === void 0 ? db.findAggregates("insights_builtin_distribution", {
			index: "byScope",
			where: {
				channel: input.channel,
				platform
			},
			range,
			limit: PAGE,
			...page
		}) : db.findAggregates("insights_builtin_distribution", {
			index: "byVersion",
			where: {
				channel: input.channel,
				platform,
				app_version: input.appVersion
			},
			range,
			limit: PAGE,
			...page
		})));
	}
	const points = [];
	for (let start = timeRange.start; start < timeRange.end; start += intervalMs) points.push({
		startMs: start,
		installations: countDistinct(mergeDistinct(usage.filter((row) => row.bucket_start_ms >= start && row.bucket_start_ms < start + intervalMs).map((row) => row.activity_users)))
	});
	const versions = /* @__PURE__ */ new Map();
	const platforms = /* @__PURE__ */ new Map();
	const bundles = /* @__PURE__ */ new Map();
	const countBundle = (row, releaseId, builtinBundleId, count) => {
		const key = JSON.stringify([
			row.app_version,
			row.platform,
			releaseId,
			builtinBundleId
		]);
		bundles.set(key, {
			appVersion: row.app_version,
			platform: row.platform,
			releaseId,
			builtinBundleId,
			installations: (bundles.get(key)?.installations ?? 0) + count
		});
	};
	for (const row of distribution) {
		const count = row.latest_installations;
		versions.set(row.app_version, (versions.get(row.app_version) ?? 0) + count);
		platforms.set(row.platform, (platforms.get(row.platform) ?? 0) + count);
		countBundle(row, row.release_id || null, null, count);
	}
	for (const row of builtinDistribution) {
		const releaseId = row.release_id || null;
		countBundle(row, releaseId, null, -row.latest_installations);
		countBundle(row, releaseId, row.builtin_bundle_id, row.latest_installations);
	}
	const sortedVersions = byInstallations(versions);
	return {
		coverage: coverageOf(timeRange.start, kept[days ? "day" : "hour"]),
		activeInstallations: countDistinct(mergeDistinct(usage.map((row) => row.activity_users))),
		points,
		appVersions: sortedVersions.map(({ name }) => name),
		versions: sortedVersions,
		platforms: byInstallations(platforms),
		bundleDistribution: [...bundles.values()].filter(({ installations }) => installations > 0),
		measuredAtMs: at
	};
};
/** The longest period the failures read covers: the console's longest, 30 days. */
const UPDATE_FAILURES_RANGE_MS = 30 * DAY_MS;
const isRange = (range) => range === void 0 || Number.isSafeInteger(range.start) && Number.isSafeInteger(range.end) && range.start >= 0 && range.start < range.end && range.end - range.start <= UPDATE_FAILURES_RANGE_MS;
const isText = (value, maxLength) => typeof value === "string" && value.length > 0 && value.length <= maxLength;
const failed = (...rows) => countDistinct(mergeDistinct(rows.flat().map((row) => row.failed_users)));
/** Entries of a count map, most first, then in key order. */
const mostFirst = (counts) => [...counts].sort(([leftKey, left], [rightKey, right]) => right.events - left.events || compareUtf8(leftKey, rightKey)).map(([, entry]) => entry);
/** The stages a failure row records: where an update failed. */
const FAILURE_STAGES = /* @__PURE__ */ new Set([
	"check",
	"download",
	"install",
	"unknown"
]);
/** Failure rows as their breakdown by stage, reason, and detail. */
const breakdownOf = (rows) => {
	const failures = /* @__PURE__ */ new Map();
	for (const { stage, reason, detail, events } of rows) {
		if (events <= 0) continue;
		const key = JSON.stringify([stage, reason]);
		const entry = failures.get(key) ?? {
			value: {
				stage,
				reason
			},
			events: 0,
			details: /* @__PURE__ */ new Map()
		};
		entry.events += events;
		const known = entry.details.get(detail) ?? {
			value: detail,
			events: 0
		};
		known.events += events;
		entry.details.set(detail, known);
		failures.set(key, entry);
	}
	return mostFirst(failures).map(({ value, events }) => {
		const { details } = failures.get(JSON.stringify([value.stage, value.reason]));
		return {
			...value,
			events,
			details: mostFirst(details).map(({ value: detail, events }) => {
				const [resource, httpStatus, originCode, transport] = JSON.parse(detail);
				return {
					resource,
					httpStatus,
					originCode,
					transport,
					events
				};
			})
		};
	});
};
/**
* A release's or a channel's update failures. Since a release's first
* report: its lifetime counters and failed installations. Over a time range
* of at most 30 days: failures, failed checks, and the breakdown by stage,
* reason, and detail, all summed from the breakdown's hourly rows; downloads
* from the counters; failed installations from their sketches. A release reads hourly rows, a
* channel daily rows past 48 hours like its activity; the breakdown's rows
* are hourly, so its coverage is the raw period's.
*/
const getUpdateFailures = async (db, input, now, retention) => {
	const { platform, channel, releaseId, timeRange } = input;
	if (platform !== "ios" && platform !== "android" || !isText(channel, 1024) || releaseId !== void 0 && !isText(releaseId, 36) || !isRange(timeRange) || releaseId === void 0 && timeRange === void 0) throw new DatabaseAdapterInputError("invalid-query");
	const at = now();
	const kept = retained(at, retention);
	const channelParts = {
		...usageParts(channel, platform),
		scopeKind: "channel"
	};
	const parts = releaseId === void 0 ? channelParts : releaseParts({
		releaseId,
		platform,
		channel
	});
	const failure = {
		...parts,
		scopeKind: "failure"
	};
	if (timeRange === void 0) {
		const where = (from) => ({ identity: insightsIdentity({
			...from,
			periodKind: "lifetime"
		}) });
		const [counters, sketches] = await Promise.all([db.findAggregates("insights_overview_lifetime", {
			index: "window",
			where: where(parts),
			range: {
				gte: 0,
				lte: 0
			},
			limit: PAGE
		}), db.findAggregates("insights_sketches_lifetime", {
			index: "window",
			where: where(failure),
			range: {
				gte: 0,
				lte: 0
			},
			limit: PAGE
		})]);
		const lifetime = counters.rows[0];
		return {
			coverage: {
				kind: "complete",
				sinceMs: 0
			},
			measuredAtMs: at,
			failedUpdates: lifetime?.failed_updates ?? 0,
			failedInstallations: countDistinct(mergeDistinct(sketches.rows.map((row) => row.failed_users))),
			downloads: lifetime?.downloads ?? 0,
			patchDownloads: lifetime?.patch_downloads ?? 0,
			patchFallbacks: lifetime?.patch_fallbacks ?? 0
		};
	}
	const days = releaseId === void 0;
	const window = [
		timeRange,
		days,
		kept.hour
	];
	const [counters, failures, checks, active, rows] = await Promise.all([
		counterRows(db, parts, ...window),
		sketchRows(db, failure, ...window),
		days ? sketchRows(db, {
			...channelParts,
			scopeKind: "check"
		}, ...window) : [],
		days ? sketchRows(db, usageParts(channel, platform), ...window) : [],
		drain((page) => db.findAggregates("insights_failures", {
			index: "byScope",
			where: {
				platform,
				channel
			},
			range: {
				gte: timeRange.start,
				lt: timeRange.end
			},
			limit: PAGE,
			...page
		}))
	]);
	const total = (field) => counters.reduce((sum, row) => sum + row[field], 0);
	const scoped = rows.filter((row) => FAILURE_STAGES.has(row.stage) && (releaseId === void 0 || row.release_id === releaseId));
	const failuresAt = (counted) => scoped.reduce((sum, row) => sum + (counted(row.stage) ? Math.max(0, row.events) : 0), 0);
	return {
		coverage: coverageOf(timeRange.start, kept.hour),
		measuredAtMs: at,
		failedUpdates: failuresAt((stage) => stage !== "check"),
		failedInstallations: failed(failures),
		downloads: total("downloads"),
		patchDownloads: total("patch_downloads"),
		patchFallbacks: total("patch_fallbacks"),
		...days ? { checks: {
			failures: failuresAt((stage) => stage === "check"),
			failedInstallations: failed(checks),
			activeInstallations: countDistinct(mergeDistinct(active.map((row) => row.activity_users)))
		} } : {},
		breakdown: breakdownOf(scoped)
	};
};
//#endregion
export { UPDATE_FAILURES_RANGE_MS, countEventSeries, countEvents, countLatestEvents, findLatestEvents, getAppUsage, getReleaseActivity, getUpdateFailures, listEvents };
