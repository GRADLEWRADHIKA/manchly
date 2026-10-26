import { defineAggregate, defineTable } from "@hot-updater/plugin-core";
//#region src/server/schema.ts
const HOUR_MS = 36e5;
const DAY_MS = 864e5;
const DEFAULT_INSIGHTS_RETENTION = {
	rawDays: 90,
	dailyDays: 400
};
const bucketRetention = (days) => ({
	field: "bucket_start_ms",
	days
});
/** Every kind of row the table keeps belongs in installation history. */
const MOVEMENTS = /* @__PURE__ */ new Set([
	"UPDATE_DOWNLOADED",
	"UPDATE_APPLIED",
	"RECOVERED",
	"UPDATE_FAILED",
	"UNCHANGED"
]);
/** A failed update check: it names no target bundle, so no bundle list shows it. */
const isFailedCheck = (row) => row.type === "UPDATE_FAILED" && row.metadata?.failure?.stage === "check";
const metadataOf = (row) => row.metadata ?? {};
/** A download or apply that arrived after its target ran: it counts nothing. */
const isLateEvent = (row) => metadataOf(row).late === true;
/**
* Whether a stored row launched its installation into a bundle release: an
* apply, or a kept UNCHANGED row that moved the installation to another
* bundle of a release, as when the apply report never arrived or a rollback
* to the built-in bundle took it there. A first report, a release change of
* the bundle already running, and a late row launch nothing.
*/
const isLaunch = (row) => {
	if (isLateEvent(row)) return false;
	if (row.type === "UPDATE_APPLIED") return true;
	if (row.type !== "UNCHANGED") return false;
	const kinds = metadataOf(row).change?.kinds ?? [];
	return kinds.includes("bundle") && !kinds.includes("first_seen") && row.to_release_id !== null;
};
/**
* The bundle a stored row's bundle filter matches: `from:<bundle>` for a
* recovery; `to:<bundle>` for a download, an apply, and an update failure;
* `on:<bundle>` for an UNCHANGED row that launched a bundle (`isLaunch`), a
* key no other row uses. None for a failed check, which targets no bundle, a
* late row, or any other UNCHANGED row.
*/
const bundleRefsOf = (row) => {
	if (isFailedCheck(row) || isLateEvent(row)) return [];
	if (row.type === "RECOVERED") return [`from:${row.from_bundle_id}`];
	if (row.type === "UNCHANGED") return isLaunch(row) ? [`on:${row.to_bundle_id}`] : [];
	return [`to:${row.to_bundle_id}`];
};
/** The key a bundle filter reads, as `bundleRefsOf` writes it. */
const bundleRefOfFilter = (filter) => filter.type === "RECOVERED" ? `from:${filter.fromBundleId}` : filter.type === "UNCHANGED" ? `on:${filter.toBundleId}` : `to:${filter.toBundleId}`;
/**
* Downloads, applies, recoveries, update failures, and the UNCHANGED
* reports that changed what their installation runs, whole. An UNCHANGED
* report that changes nothing counts as a launch and moves its
* installation's head, but no row keeps it.
*/
const bundleEvents = (days) => defineTable({
	id: {
		type: "string",
		maxLength: 36
	},
	type: {
		type: "string",
		maxLength: 32
	},
	install_id: {
		type: "string",
		maxLength: 255
	},
	user_id: {
		type: "string",
		maxLength: 255,
		required: false
	},
	from_release_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	from_bundle_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	to_release_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	to_bundle_id: {
		type: "string",
		maxLength: 36
	},
	platform: {
		type: "string",
		maxLength: 16
	},
	app_version: { type: "string" },
	channel: { type: "string" },
	metadata: { type: "json" },
	received_at_ms: { type: "integer" }
}, {
	key: ["id"],
	derived: {
		/** The UTC day the event was received in. */
		day: {
			type: "integer",
			compute: (row) => row.received_at_ms - row.received_at_ms % DAY_MS
		},
		/** Every stored event belongs in installation history. */
		movement_install_id: {
			type: "string",
			compute: (row) => MOVEMENTS.has(row.type) ? row.install_id : null
		},
		/** The bundle a bundle filter matches (`bundleRefsOf`). */
		bundle_ref: {
			type: "string",
			multi: true,
			compute: (row) => bundleRefsOf(row)
		}
	},
	indexes: {
		movementsByInstall: {
			eq: ["movement_install_id"],
			sort: ["received_at_ms"]
		},
		byBundle: {
			eq: [
				"platform",
				"channel",
				"type",
				"bundle_ref",
				"day"
			],
			sort: ["received_at_ms"]
		},
		/** Events of every scope by day, for the console's unfiltered event list. */
		byDay: {
			eq: ["day"],
			sort: ["received_at_ms"]
		}
	},
	retention: {
		field: "day",
		days
	}
});
/**
* Each installation's latest event, whole, so reading it is one point read.
* Its gauges count it in the UTC day of that event. An update failure moves
* nothing, so no head holds one.
*/
const bundleEventHeads = (days) => defineTable({
	install_id: {
		type: "string",
		maxLength: 255
	},
	id: {
		type: "string",
		maxLength: 36
	},
	type: {
		type: "string",
		maxLength: 32
	},
	user_id: {
		type: "string",
		maxLength: 255,
		required: false
	},
	from_release_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	from_bundle_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	to_release_id: {
		type: "string",
		maxLength: 36,
		required: false
	},
	to_bundle_id: {
		type: "string",
		maxLength: 36
	},
	platform: {
		type: "string",
		maxLength: 16
	},
	app_version: { type: "string" },
	channel: { type: "string" },
	metadata: { type: "json" },
	received_at_ms: { type: "integer" }
}, {
	key: ["install_id"],
	indexes: { byUser: {
		eq: ["user_id"],
		sort: ["install_id"]
	} },
	retention: {
		field: "received_at_ms",
		days
	}
});
/**
* Shards are keyed by install id. Counters are blind increments and never
* conflict, so they keep 8. Gauges and sketches are read, merged, and written
* back. B3's rollout gate on PostgreSQL retried 2.4% of transactions at 8
* shards and 1.3% at 16. DynamoDB's transactions take longer, so D8's gate
* on DynamoDB Local retried 2–24% at 16, almost all on gauge rows, and 1–5%
* with gauges at 32. Sketches stay at 16: each shard row carries 2 KB of
* registers that every read merges.
*
* Every Insights aggregate is `batched`: on DynamoDB and Firestore, which
* bill each write, an event's changes apply after it commits, merged with
* other events' into one write per row, on one shard per writer.
*/
const COUNTER_SHARDS = 8;
const GAUGE_SHARDS = 32;
const SKETCH_SHARDS = 16;
/** Rows keyed by a hashed identity (scope and period) and a bucket. */
const identityFields = {
	identity: {
		type: "string",
		maxLength: 32
	},
	bucket_start_ms: { type: "integer" }
};
const window = {
	eq: ["identity"],
	sort: ["bucket_start_ms"]
};
/** What a release or channel row counts in every period kind. */
const WINDOW_COUNTERS = [
	"downloads",
	"failed_launches",
	"patch_downloads",
	"patch_fallbacks"
];
/**
* Hourly or daily counters: a release or channel row counts downloads,
* launches that crashed and recovered (`failed_launches`), and downloads a
* patch delivered and those that fell back from one.
*/
const counters = (retention) => defineAggregate(identityFields, {
	key: ["identity", "bucket_start_ms"],
	counters: WINDOW_COUNTERS,
	shards: COUNTER_SHARDS,
	batched: true,
	indexes: { window },
	retention
});
/**
* A release's counters since its first report, at bucket 0: the windowed
* counters, its applies, which the bundle list reads, and its failed updates
* (`failed_updates`), since no breakdown row outlives the raw period; windowed
* reads sum `insights_failures` instead.
*/
const lifetimeCounters = () => defineAggregate(identityFields, {
	key: ["identity", "bucket_start_ms"],
	counters: [
		...WINDOW_COUNTERS,
		"applies",
		"failed_updates"
	],
	shards: COUNTER_SHARDS,
	batched: true,
	indexes: { window }
});
/**
* Unique-installation sketches of one period kind: a usage row's active
* installations (`activity_users`), and a `failure` or `check` row's
* installations whose update or update check failed (`failed_users`).
*/
const sketches = (retention) => defineAggregate(identityFields, {
	key: ["identity", "bucket_start_ms"],
	distinct: ["activity_users", "failed_users"],
	shards: SKETCH_SHARDS,
	batched: true,
	indexes: { window },
	retention
});
/** Installations whose update to a release failed, since its first failure: kept, at bucket 0. */
const lifetimeSketches = () => defineAggregate(identityFields, {
	key: ["identity", "bucket_start_ms"],
	distinct: ["failed_users"],
	shards: SKETCH_SHARDS,
	batched: true,
	indexes: { window }
});
/**
* Update failures by what failed, a row an hour. `release_id` is the failed
* update's target release, or empty for a failed check or an unknown target.
* `stage` and `reason` say where and why it failed, and `detail` what else
* the client knew, as the JSON array `[resource, httpStatus, originCode,
* transport]`. Every index is in key order, so its counters stay blind
* increments.
*/
const insightsFailures = (retention) => defineAggregate({
	platform: {
		type: "string",
		maxLength: 16
	},
	channel: { type: "string" },
	bucket_start_ms: { type: "integer" },
	release_id: {
		type: "string",
		maxLength: 36
	},
	stage: {
		type: "string",
		maxLength: 16
	},
	reason: {
		type: "string",
		maxLength: 64
	},
	detail: {
		type: "string",
		maxLength: 160
	}
}, {
	key: [
		"platform",
		"channel",
		"bucket_start_ms",
		"release_id",
		"stage",
		"reason",
		"detail"
	],
	counters: ["events"],
	shards: COUNTER_SHARDS,
	batched: true,
	indexes: { byScope: {
		eq: ["platform", "channel"],
		sort: ["bucket_start_ms"]
	} },
	retention
});
/** Installations counted in the UTC day of their latest event, so reads sum whole UTC days. */
const insightsDistribution = (retention) => defineAggregate({
	channel: { type: "string" },
	platform: {
		type: "string",
		maxLength: 16
	},
	app_version: { type: "string" },
	release_id: {
		type: "string",
		maxLength: 36
	},
	bucket_start_ms: { type: "integer" }
}, {
	key: [
		"channel",
		"platform",
		"app_version",
		"release_id",
		"bucket_start_ms"
	],
	gauges: ["latest_installations"],
	shards: GAUGE_SHARDS,
	batched: true,
	indexes: {
		byScope: {
			eq: ["channel", "platform"],
			sort: ["bucket_start_ms"]
		},
		byVersion: {
			eq: [
				"channel",
				"platform",
				"app_version"
			],
			sort: ["bucket_start_ms"]
		}
	},
	retention
});
/**
* The installations of `insights_distribution` that run their native build's
* built-in bundle, by its ID (`builtin_bundle_id`), within the same rows:
* reads move them out of the row of their release, or of no release.
*/
const insightsBuiltinDistribution = (retention) => defineAggregate({
	channel: { type: "string" },
	platform: {
		type: "string",
		maxLength: 16
	},
	app_version: { type: "string" },
	release_id: {
		type: "string",
		maxLength: 36
	},
	builtin_bundle_id: {
		type: "string",
		maxLength: 36
	},
	bucket_start_ms: { type: "integer" }
}, {
	key: [
		"channel",
		"platform",
		"app_version",
		"release_id",
		"builtin_bundle_id",
		"bucket_start_ms"
	],
	gauges: ["latest_installations"],
	shards: GAUGE_SHARDS,
	batched: true,
	indexes: {
		byScope: {
			eq: ["channel", "platform"],
			sort: ["bucket_start_ms"]
		},
		byVersion: {
			eq: [
				"channel",
				"platform",
				"app_version"
			],
			sort: ["bucket_start_ms"]
		}
	},
	retention
});
/** Latest events by the bundle they came from or went to, bucketed like the distribution. */
const insightsLatestByBundle = (retention) => defineAggregate({
	platform: {
		type: "string",
		maxLength: 16
	},
	channel: { type: "string" },
	bundle_field: {
		type: "string",
		maxLength: 16
	},
	bundle_id: {
		type: "string",
		maxLength: 36
	},
	type: {
		type: "string",
		maxLength: 32
	},
	bucket_start_ms: { type: "integer" }
}, {
	key: [
		"platform",
		"channel",
		"bundle_field",
		"bundle_id",
		"type",
		"bucket_start_ms"
	],
	gauges: ["installations"],
	shards: GAUGE_SHARDS,
	batched: true,
	indexes: { byBundle: {
		eq: [
			"platform",
			"channel",
			"bundle_field",
			"bundle_id",
			"type"
		],
		sort: ["bucket_start_ms"]
	} },
	retention
});
/**
* Stored events by outcome and the bundle a bundle filter matches, a row an
* hour, which a failed check has none of; and every stored event, a row a UTC
* day (`DAILY_EVENTS`). Bundle counts sum the hourly rows, and event lists
* read either to skip days without events.
*/
const insightsOutcomes = (retention) => defineAggregate({
	platform: {
		type: "string",
		maxLength: 16
	},
	channel: { type: "string" },
	type: {
		type: "string",
		maxLength: 32
	},
	bundle_ref: {
		type: "string",
		maxLength: 41
	},
	bucket_start_ms: { type: "integer" }
}, {
	key: [
		"platform",
		"channel",
		"type",
		"bundle_ref",
		"bucket_start_ms"
	],
	counters: ["events"],
	shards: COUNTER_SHARDS,
	batched: true,
	indexes: { byRef: {
		eq: [
			"platform",
			"channel",
			"type",
			"bundle_ref"
		],
		sort: ["bucket_start_ms"]
	} },
	retention
});
/**
* The `insights_outcomes` identity that counts every stored event, for the
* global event list. Its bucket is a UTC day, not an hour. Every event's
* platform is ios or android, so no outcome row of a bundle filter shares it.
*/
const DAILY_EVENTS = {
	platform: "*",
	channel: "",
	type: "",
	bundle_ref: ""
};
/**
* Insights' tables, each expiring after its period. The periods are values
* the engine applies at runtime; the tables and indexes are the same for
* any periods.
*/
const createInsightsSchema = ({ rawDays, dailyDays } = DEFAULT_INSIGHTS_RETENTION) => {
	const hourly = bucketRetention(rawDays);
	const daily = bucketRetention(dailyDays);
	return {
		bundle_events: bundleEvents(rawDays),
		bundle_event_heads: bundleEventHeads(dailyDays),
		/** Hourly counters and sketches: the raw period. */
		insights_overview: counters(hourly),
		insights_sketches: sketches(hourly),
		/** Daily counters and sketches: the daily period. */
		insights_overview_daily: counters(daily),
		insights_sketches_daily: sketches(daily),
		/** A release's counters since its first event, and its failed installations: kept. */
		insights_overview_lifetime: lifetimeCounters(),
		insights_sketches_lifetime: lifetimeSketches(),
		insights_distribution: insightsDistribution(daily),
		insights_builtin_distribution: insightsBuiltinDistribution(daily),
		insights_latest_by_bundle: insightsLatestByBundle(daily),
		insights_outcomes: insightsOutcomes(hourly),
		insights_failures: insightsFailures(hourly)
	};
};
const insightsSchema = createInsightsSchema();
//#endregion
export { DAILY_EVENTS, DAY_MS, DEFAULT_INSIGHTS_RETENTION, HOUR_MS, bundleRefOfFilter, bundleRefsOf, createInsightsSchema, insightsSchema, isFailedCheck, isLateEvent, isLaunch };
