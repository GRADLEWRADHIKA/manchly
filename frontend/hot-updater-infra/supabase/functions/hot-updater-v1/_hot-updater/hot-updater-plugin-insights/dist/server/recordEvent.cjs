const require_eventRow = require("./eventRow.cjs");
const require_schema = require("./schema.cjs");
const require_contract = require("./contract.cjs");
const require_overview = require("./overview.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/recordEvent.ts
const hourOf = (ms) => ms - ms % require_schema.HOUR_MS;
const dayOf = (ms) => ms - ms % require_schema.DAY_MS;
/** The `identity` of an overview or sketch row: its scope and period, hashed. */
const insightsIdentity = (identity) => require_overview.insightsOverviewId({
	...identity,
	scopeKind: identity.scopeKind,
	periodKind: identity.periodKind,
	bucketStartMs: 0
});
/**
* The bucket a head's gauges count it in, the UTC day of its event, and what
* its distribution row names: the release it runs, which a download leaves
* at its source, and the built-in bundle, when it runs the native build's.
* A head stored without the built-in bundle ID counts in no built-in row, so
* taking it back moves none.
*/
const gaugeSlot = (head) => ({
	bucket: dayOf(head.received_at_ms),
	releaseId: head.type === "UPDATE_DOWNLOADED" ? head.from_release_id : head.to_release_id,
	builtinBundleId: require_eventRow.runningBuiltinBundleId(head)
});
/**
* The `insights_latest_by_bundle` field of a head's (from, to) pair. A head
* matches a `from` and a `to` predicate of one type at once only through its
* pair, so this gauge is what a count subtracts to count it once.
*/
const PAIR_FIELD = "from_to";
/** The pair gauge's `bundle_id`: a hash of the two bundle ids, which fit no single 36-character column. */
const bundlePairKey = (from, to) => require_overview.insightsKey(`${from.length}:${from}${to.length}:${to}`);
/**
* Moves a head's gauges: the distribution row, and the built-in one when it
* runs its build's built-in bundle, one row per bundle it references, and
* its pair; -1 takes back the head an event replaces.
*/
const countHead = (tx, head, delta) => {
	const { bucket, releaseId, builtinBundleId } = gaugeSlot(head);
	const shardBy = head.install_id;
	tx.aggregate("insights_distribution", {
		channel: head.channel,
		platform: head.platform,
		app_version: head.app_version,
		release_id: releaseId ?? "",
		bucket_start_ms: bucket
	}, { latest_installations: delta }, { shardBy });
	if (builtinBundleId !== null) tx.aggregate("insights_builtin_distribution", {
		channel: head.channel,
		platform: head.platform,
		app_version: head.app_version,
		release_id: releaseId ?? "",
		builtin_bundle_id: builtinBundleId,
		bucket_start_ms: bucket
	}, { latest_installations: delta }, { shardBy });
	for (const field of ["from_bundle_id", "to_bundle_id"]) {
		const bundleId = head[field];
		if (bundleId === null) continue;
		tx.aggregate("insights_latest_by_bundle", {
			platform: head.platform,
			channel: head.channel,
			bundle_field: field,
			bundle_id: bundleId,
			type: head.type,
			bucket_start_ms: bucket
		}, { installations: delta }, { shardBy });
	}
	if (head.from_bundle_id !== null) tx.aggregate("insights_latest_by_bundle", {
		platform: head.platform,
		channel: head.channel,
		bundle_field: PAIR_FIELD,
		bundle_id: bundlePairKey(head.from_bundle_id, head.to_bundle_id),
		type: head.type,
		bucket_start_ms: bucket
	}, { installations: delta }, { shardBy });
};
/**
* Where each period's rows go, each with its retention: hours for 90 days,
* days for 13 months, and a release's lifetime counters kept.
*/
const PERIOD_MODELS = {
	hour: {
		counters: "insights_overview",
		sketches: "insights_sketches"
	},
	day: {
		counters: "insights_overview_daily",
		sketches: "insights_sketches_daily"
	},
	lifetime: {
		counters: "insights_overview_lifetime",
		sketches: void 0
	}
};
/** A download's patch counters: a patch delivered it, or it fell back from one. */
const patchCounters = (event) => event.type !== "UPDATE_DOWNLOADED" ? {} : {
	...event.metadata.delivery === "patch" ? { patch_downloads: 1 } : {},
	...event.metadata.patch_fallback === true ? { patch_fallbacks: 1 } : {}
};
/**
* Counters and sketches for one event: release, channel, and usage rows, with
* day rollups for channel and usage. Only usage rows keep a sketch, of active
* installations, and only for the event's platform, since a read for every
* platform merges the ios and android sketches. A download's patch counters
* go in the rows that count it.
*/
const countEvent = (tx, event) => {
	const shardBy = event.install_id;
	for (const delta of require_overview.insightsOverviewDeltas(event)) {
		if (delta.identity.platform === "all") continue;
		const { bucketStartMs, ...parts } = delta.identity;
		const periods = parts.scopeKind === "channel" || parts.scopeKind === "usage" ? [["hour", bucketStartMs], ["day", dayOf(event.received_at_ms)]] : [[parts.periodKind, bucketStartMs]];
		for (const [periodKind, bucket] of periods) {
			const models = PERIOD_MODELS[periodKind];
			const key = {
				identity: insightsIdentity({
					...parts,
					periodKind
				}),
				bucket_start_ms: bucket
			};
			const counters = {
				...Object.fromEntries([
					["downloads", delta.downloads],
					["applies", delta.applies],
					["failed_launches", delta.failedLaunches]
				].filter(([, value]) => value !== 0)),
				...delta.downloads === 0 ? {} : patchCounters(event)
			};
			if (Object.keys(counters).length > 0) tx.aggregate(models.counters, key, counters, { shardBy });
			if (models.sketches !== void 0 && delta.activityIdentity !== void 0) tx.aggregate(models.sketches, key, { activity_users: (0, _hot_updater_plugin_core.addDistinct)(null, delta.activityIdentity) }, { shardBy });
		}
	}
};
/**
* A stored event's outcome rows: its bundle filter's hour, when it has one
* (`bundleRefsOf`), and every stored event's UTC day. A download that a
* launch or crash implied counts in its bundle's download hour too, in the
* hour of that launch or crash, so the download series covers what the
* release's downloads count; the launch or crash is its row.
*/
const countOutcome = (tx, event) => {
	const shardBy = event.install_id;
	const hour = (type, bundleRef) => tx.aggregate("insights_outcomes", {
		platform: event.platform,
		channel: event.channel,
		type,
		bundle_ref: bundleRef,
		bucket_start_ms: hourOf(event.received_at_ms)
	}, { events: 1 }, { shardBy });
	for (const bundleRef of require_schema.bundleRefsOf(event)) hour(event.type, bundleRef);
	if (event.metadata.implied_download === true) hour("UPDATE_DOWNLOADED", require_schema.bundleRefOfFilter({
		type: "UPDATE_DOWNLOADED",
		toBundleId: event.type === "RECOVERED" ? event.from_bundle_id : event.to_bundle_id
	}));
	tx.aggregate("insights_outcomes", {
		...require_schema.DAILY_EVENTS,
		bucket_start_ms: dayOf(event.received_at_ms)
	}, { events: 1 }, { shardBy });
};
/** The row check requires an UPDATE_FAILED row's failure; its type leaves it optional. */
const UNKNOWN_FAILURE = {
	stage: "unknown",
	reason: "unknown"
};
/** A failure's `detail`: what else the client knew, as a JSON array. */
const failureDetail = (failure) => JSON.stringify([
	failure.resource ?? null,
	failure.http_status ?? null,
	failure.origin_code ?? null,
	failure.transport ?? null
]);
/**
* An update failure's sketches, breakdown row, and lifetime counter. Its
* hourly breakdown row is what windowed reads sum, so no hourly or daily
* counter repeats it. A failed check counts for its channel, in the `check`
* sketch of installations. Any other failure counts in the channel's
* `failure` sketch, and for its target release, when it names one, in the
* release's hourly and lifetime `failure` sketches and its lifetime
* `failed_updates`, which the bundle detail reads. A failure is no launch
* and no activity: the installation reports its launch that day.
*/
const countFailure = (tx, event) => {
	const shardBy = event.install_id;
	const failure = event.metadata.failure ?? UNKNOWN_FAILURE;
	const check = failure.stage === "check";
	const hour = hourOf(event.received_at_ms);
	const scope = {
		channel: event.channel,
		platform: event.platform,
		appVersionKind: "all",
		appVersion: ""
	};
	const channel = {
		...scope,
		releaseKind: "all",
		releaseId: ""
	};
	const users = { failed_users: (0, _hot_updater_plugin_core.addDistinct)(null, event.install_id) };
	for (const [periodKind, bucket] of [["hour", hour], ["day", dayOf(event.received_at_ms)]]) {
		const identity = insightsIdentity({
			...channel,
			scopeKind: check ? "check" : "failure",
			periodKind
		});
		tx.aggregate(PERIOD_MODELS[periodKind].sketches, {
			identity,
			bucket_start_ms: bucket
		}, users, { shardBy });
	}
	const releaseId = check ? null : event.to_release_id;
	if (releaseId !== null) {
		const release = {
			...scope,
			releaseKind: "specific",
			releaseId
		};
		for (const [periodKind, bucket, sketches] of [[
			"hour",
			hour,
			"insights_sketches"
		], [
			"lifetime",
			0,
			"insights_sketches_lifetime"
		]]) {
			const key = (scopeKind) => ({
				identity: insightsIdentity({
					...release,
					scopeKind,
					periodKind
				}),
				bucket_start_ms: bucket
			});
			tx.aggregate(sketches, key("failure"), users, { shardBy });
		}
		tx.aggregate("insights_overview_lifetime", {
			identity: insightsIdentity({
				...release,
				scopeKind: "release",
				periodKind: "lifetime"
			}),
			bucket_start_ms: 0
		}, { failed_updates: 1 }, { shardBy });
	}
	tx.aggregate("insights_failures", {
		platform: event.platform,
		channel: event.channel,
		bucket_start_ms: hour,
		release_id: releaseId ?? "",
		stage: failure.stage,
		reason: failure.reason,
		detail: failureDetail(failure)
	}, { events: 1 }, { shardBy });
};
const isNewer = (event, head) => event.received_at_ms !== head.received_at_ms ? event.received_at_ms > head.received_at_ms : (0, _hot_updater_plugin_core.compareUtf8)(event.id, head.id) > 0;
/** What a head says its installation runs: a download leaves it at the source. */
const runningOf = (head) => head.type === "UPDATE_DOWNLOADED" ? {
	bundle_id: head.from_bundle_id,
	release_id: head.from_release_id
} : {
	bundle_id: head.to_bundle_id,
	release_id: head.to_release_id
};
/** The native build a report or head came from, when its SDK says. */
const minBundleIdOf = (row) => row.metadata?.min_bundle_id;
/** When the client made a report, from the UUIDv7 it gave it. */
const madeAt = (id) => (0, _hot_updater_plugin_core.isUUIDv7)(id) ? (0, _hot_updater_plugin_core.extractTimestampFromUUIDv7)(id) : null;
/**
* A report its installation already moved past, which stays in history but
* moves and counts nothing:
* - a download or an apply of the bundle the head already runs, or a
*   download that repeats the head's pending one, from the same bundle to
*   the same bundle: the installation's download or launch already counted;
* - an UNCHANGED report made, by its UUIDv7, before the head's report, even
*   after a later report replaced the apply it preceded: a reload can cut
*   one runtime's report short and deliver it after the next runtime's.
*
* Report IDs are made on the device, so a device whose clock jumps back has
* its launch reports judged late until its clock passes its latest report.
*/
const isLate = (event, head) => {
	if (head === null) return false;
	if (event.type === "UPDATE_DOWNLOADED" || event.type === "UPDATE_APPLIED") return event.to_bundle_id === runningOf(head).bundle_id || event.type === "UPDATE_DOWNLOADED" && head.type === "UPDATE_DOWNLOADED" && event.from_bundle_id === head.from_bundle_id && event.to_bundle_id === head.to_bundle_id;
	if (event.type === "UNCHANGED") {
		const made = madeAt(event.id);
		const latest = madeAt(head.id);
		return made !== null && latest !== null && made < latest;
	}
	return false;
};
/**
* What an UNCHANGED report changes against its installation's head: the
* running bundle or release, the app version, the channel, or the native
* build (when both name it), with the head's values before it; `first_seen`
* when the installation has no head. A report the head already answers, one
* older than the head, a user switch and any other event type change
* nothing, so no row keeps them.
*/
const changeOf = (event, head) => {
	if (event.type !== "UNCHANGED") return null;
	if (head === null) return {
		kinds: ["first_seen"],
		previous: null
	};
	if (!isNewer(event, head)) return null;
	const running = runningOf(head);
	const build = minBundleIdOf(event);
	const headBuild = minBundleIdOf(head);
	const kinds = [];
	if (event.to_bundle_id !== running.bundle_id) kinds.push("bundle");
	if (event.to_release_id !== running.release_id) kinds.push("release");
	if (event.app_version !== head.app_version) kinds.push("app_version");
	if (event.channel !== head.channel) kinds.push("channel");
	if (build !== void 0 && headBuild !== void 0 && build !== headBuild) kinds.push("native_build");
	return kinds.length === 0 ? null : {
		kinds,
		previous: {
			bundle_id: running.bundle_id,
			release_id: running.release_id,
			app_version: head.app_version,
			channel: head.channel,
			...headBuild === void 0 ? {} : { min_bundle_id: headBuild }
		}
	};
};
/**
* Whether a launch or a crash comes with no download report for its target:
* its head shows neither that download nor the target already running. The
* native build's built-in bundle is never downloaded, and without a head the
* server knows nothing of the installation's past, so it implies nothing.
*/
const impliesDownload = (event, head) => {
	const target = event.type === "RECOVERED" ? {
		bundle: event.from_bundle_id,
		release: event.from_release_id
	} : require_schema.isLaunch(event) ? {
		bundle: event.to_bundle_id,
		release: event.to_release_id
	} : null;
	if (target === null || target.release === null || target.bundle === minBundleIdOf(event)) return false;
	if (head === null) return false;
	if (head.type === "UPDATE_DOWNLOADED" && head.to_bundle_id === target.bundle) return false;
	return runningOf(head).bundle_id !== target.bundle;
};
/**
* The event as recorded, with what only the server sets: what a kept
* UNCHANGED report changed, a late report's flag, and a download its launch
* or crash implied.
*/
const recordedOf = (event, head) => {
	const { change: _change, late: _late, implied_download: _implied, ...metadata } = event.metadata;
	const reported = {
		...event,
		metadata
	};
	const late = isLate(reported, head);
	const change = late ? null : changeOf(reported, head);
	const withChange = change === null ? reported : {
		...reported,
		metadata: {
			...metadata,
			change
		}
	};
	return {
		recorded: late && reported.type !== "UNCHANGED" ? {
			...reported,
			metadata: {
				...metadata,
				late: true
			}
		} : !late && impliesDownload(withChange, head) ? {
			...withChange,
			metadata: {
				...withChange.metadata,
				implied_download: true
			}
		} : withChange,
		late
	};
};
/** What an UNCHANGED report must share with its installation's head to repeat it. */
const REPEATED_FIELDS = [
	"channel",
	"platform",
	"app_version",
	"to_bundle_id",
	"to_release_id",
	"user_id"
];
/**
* An UNCHANGED report that repeats its installation's head from the same UTC
* day: the installation already counts as active that day, on that bundle,
* so the report records nothing. A download's head does not count, because
* its installation still ran the bundle it downloaded from.
*/
const repeatsHead = (event, head) => event.type === "UNCHANGED" && head.type !== "UPDATE_DOWNLOADED" && dayOf(event.received_at_ms) === dayOf(head.received_at_ms) && REPEATED_FIELDS.every((field) => event[field] === head[field]);
/**
* Records one event in one transaction: one batch read of the event and its
* installation's head, one of the gauge and sketch rows it changes, then one
* write. On a database that batches aggregates (DynamoDB, Firestore), the
* write holds the event's rows and one log row instead, and a compaction
* reads and writes the aggregate rows. A stored event's id changes nothing
* when repeated, whichever installation sends it, and neither does the id
* of the installation's head. An UNCHANGED report that repeats its head on
* the same UTC day writes nothing at all. An older event still counts in its
* own hour but never replaces the head. An update failure is stored and
* counted, but changes what no installation runs, so it moves no head.
*/
const recordEvent = (db, event) => {
	require_contract.assertBundleEventRow(event);
	return db.transaction(async (tx) => {
		const [existing, previous] = await Promise.all([tx.findOne("bundle_events", { id: event.id }), tx.findOne("bundle_event_heads", { install_id: event.install_id })]);
		if (existing !== null || previous?.id === event.id) return;
		if (previous !== null && repeatsHead(event, previous)) return;
		const { recorded, late } = recordedOf(event, previous);
		if (recorded.type !== "UNCHANGED" || recorded.metadata.change !== void 0 && !late) {
			tx.create("bundle_events", recorded);
			countOutcome(tx, recorded);
		}
		if (recorded.type === "UPDATE_FAILED") {
			countFailure(tx, recorded);
			return;
		}
		countEvent(tx, recorded);
		if (previous !== null && (late || !isNewer(recorded, previous))) return;
		if (previous === null) tx.create("bundle_event_heads", recorded);
		else {
			const { install_id: _, ...fields } = recorded;
			countHead(tx, previous, -1);
			tx.update("bundle_event_heads", previous, fields);
		}
		countHead(tx, recorded, 1);
	});
};
//#endregion
exports.PAIR_FIELD = PAIR_FIELD;
exports.bundlePairKey = bundlePairKey;
exports.insightsIdentity = insightsIdentity;
exports.recordEvent = recordEvent;
