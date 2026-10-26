const require_comparison_DenM3wCn = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/comparison-DenM3wCn.cjs");
const require_range_DvX_Y6iv = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/range-DvX-Y6iv.cjs");
const require_version_CQ98ZBpL = require("./node_modules/.pnpm/verkit@0.4.0/node_modules/verkit/dist/version-CQ98ZBpL.cjs");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/releaseCatalogCompiler.ts
var ReleaseCatalogCompilationError = class extends Error {
	code;
	constructor(code, message) {
		super(message);
		this.name = "ReleaseCatalogCompilationError";
		this.code = code;
	}
};
function compareBounds(left, right) {
	return require_comparison_DenM3wCn.t(left, right);
}
function strongerLower(current, candidate) {
	if (current === null) return candidate;
	const compared = compareBounds(candidate.version, current.version);
	if (compared > 0) return candidate;
	if (compared < 0) return current;
	return {
		version: current.version,
		inclusive: current.inclusive && candidate.inclusive
	};
}
function strongerUpper(current, candidate) {
	if (current === null) return candidate;
	const compared = compareBounds(candidate.version, current.version);
	if (compared < 0) return candidate;
	if (compared > 0) return current;
	return {
		version: current.version,
		inclusive: current.inclusive && candidate.inclusive
	};
}
function comparatorVersion(comparator) {
	const version = comparator.version && require_version_CQ98ZBpL.p(comparator.version);
	if (version === null) throw new ReleaseCatalogCompilationError("INVALID_TARGET_RANGE", `Invalid comparator: ${comparator.value}`);
	return version;
}
function comparatorSetToInterval(comparators) {
	let lower = null;
	let upper = null;
	for (const comparator of comparators) {
		if (comparator.version === null) continue;
		const version = comparatorVersion(comparator);
		if (comparator.operator === "") {
			lower = strongerLower(lower, {
				inclusive: true,
				version
			});
			upper = strongerUpper(upper, {
				inclusive: true,
				version
			});
		} else if (comparator.operator === ">") lower = strongerLower(lower, {
			inclusive: false,
			version
		});
		else if (comparator.operator === ">=") lower = strongerLower(lower, {
			inclusive: true,
			version
		});
		else if (comparator.operator === "<") upper = strongerUpper(upper, {
			inclusive: false,
			version
		});
		else if (comparator.operator === "<=") upper = strongerUpper(upper, {
			inclusive: true,
			version
		});
	}
	if (lower !== null && upper !== null) {
		const compared = compareBounds(lower.version, upper.version);
		if (compared > 0 || compared === 0 && (!lower.inclusive || !upper.inclusive)) return null;
	}
	return {
		lower,
		upper
	};
}
function rangeToIntervals(range) {
	try {
		return require_range_DvX_Y6iv.m(range).sets.flatMap((comparators) => {
			const interval = comparatorSetToInterval(comparators);
			return interval === null ? [] : [interval];
		});
	} catch {
		throw new ReleaseCatalogCompilationError("INVALID_TARGET_RANGE", `Invalid target app-version range: ${range}`);
	}
}
function releaseDescriptor(release) {
	return {
		releaseId: release.id,
		kind: release.kind,
		bundleId: release.bundleId,
		rolloutCohortCount: release.rolloutCohortCount,
		targetCohorts: [...new Set(release.targetCohorts)].sort(),
		shouldForceUpdate: release.shouldForceUpdate,
		message: release.message
	};
}
function validateReleases(releases, strategy) {
	const enabled = releases.filter((release) => release.enabled).sort((left, right) => right.id.localeCompare(left.id));
	const seenIds = /* @__PURE__ */ new Set();
	for (const release of enabled) {
		if (!(0, _hot_updater_protocol.isUUIDv7)(release.id)) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Release ${release.id} must use a canonical lowercase UUIDv7 ID`);
		if (seenIds.has(release.id)) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Duplicate Release ID: ${release.id}`);
		seenIds.add(release.id);
		if (release.strategy !== strategy) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Release ${release.id} has the wrong strategy`);
		if (release.bundleId === null) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Release ${release.id} has no Bundle`);
		if (release.targetCohorts.length > _hot_updater_protocol.MAX_TARGET_COHORTS_PER_RELEASE) throw new ReleaseCatalogCompilationError("TARGET_COHORT_LIMIT", `Release ${release.id} exceeds ${_hot_updater_protocol.MAX_TARGET_COHORTS_PER_RELEASE} target cohorts`);
		if (strategy === "APP_VERSION" && (release.targetAppVersion === null || release.fingerprintHash !== null)) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Release ${release.id} has an invalid app-version target`);
		if (strategy === "FINGERPRINT" && (release.fingerprintHash === null || release.targetAppVersion !== null)) throw new ReleaseCatalogCompilationError("INVALID_RELEASE", `Release ${release.id} has an invalid fingerprint target`);
	}
	return enabled;
}
function collectFrontierReleaseIds(releases) {
	if (releases.every((release) => (0, _hot_updater_protocol.normalizeRolloutCohortCount)(release.rolloutCohortCount) >= _hot_updater_protocol.NUMERIC_COHORT_SIZE)) {
		const retained = /* @__PURE__ */ new Set();
		const bundleIds = /* @__PURE__ */ new Set();
		for (const release of releases) {
			if (release.bundleId !== null && !bundleIds.has(release.bundleId)) {
				bundleIds.add(release.bundleId);
				retained.add(release.id);
			}
			if (bundleIds.size >= 11) break;
		}
		return retained;
	}
	const explicitTargetCohorts = new Set(releases.flatMap((release) => release.targetCohorts));
	const cohortStates = [
		void 0,
		...Array.from({ length: 1e3 }, (_, index) => String(index + 1)),
		...[...explicitTargetCohorts].sort(),
		"release-catalog-non-targeted-cohort"
	].map((cohort) => {
		const normalized = cohort === void 0 ? void 0 : (0, _hot_updater_protocol.normalizeCohortValue)(cohort);
		return {
			isCustom: normalized !== void 0 && (0, _hot_updater_protocol.isCustomCohort)(normalized),
			normalized,
			numeric: normalized === void 0 ? null : (0, _hot_updater_protocol.getNumericCohortValue)(normalized),
			bundleIds: /* @__PURE__ */ new Set(),
			complete: false
		};
	});
	const stateIndexesByCohort = /* @__PURE__ */ new Map();
	const fullRolloutStateIndexes = [];
	for (const [index, state] of cohortStates.entries()) {
		if (state.normalized !== void 0) {
			const indexes = stateIndexesByCohort.get(state.normalized) ?? [];
			indexes.push(index);
			stateIndexesByCohort.set(state.normalized, indexes);
		}
		if (state.normalized === void 0 || state.numeric !== null || state.isCustom) fullRolloutStateIndexes.push(index);
	}
	const retained = /* @__PURE__ */ new Set();
	let incompleteStateCount = cohortStates.length;
	for (const release of releases) {
		const rolloutCohortCount = (0, _hot_updater_protocol.normalizeRolloutCohortCount)(release.rolloutCohortCount);
		const eligibleStateIndexes = /* @__PURE__ */ new Set();
		if (rolloutCohortCount >= _hot_updater_protocol.NUMERIC_COHORT_SIZE) for (const index of fullRolloutStateIndexes) eligibleStateIndexes.add(index);
		else if (rolloutCohortCount > 0) for (const numericCohort of (0, _hot_updater_protocol.getRolledOutNumericCohorts)(release.id, rolloutCohortCount)) for (const index of stateIndexesByCohort.get(String(numericCohort)) ?? []) eligibleStateIndexes.add(index);
		for (const targetCohort of new Set(release.targetCohorts.map(_hot_updater_protocol.normalizeCohortValue))) for (const index of stateIndexesByCohort.get(targetCohort) ?? []) eligibleStateIndexes.add(index);
		for (const index of eligibleStateIndexes) {
			const state = cohortStates[index];
			if (state.complete) continue;
			if (release.bundleId !== null && !state.bundleIds.has(release.bundleId)) {
				state.bundleIds.add(release.bundleId);
				retained.add(release.id);
			}
			if (state.bundleIds.size >= 11) {
				state.complete = true;
				incompleteStateCount -= 1;
			}
		}
		if (incompleteStateCount === 0) break;
	}
	return retained;
}
function intervalContainsSegment(interval, segment) {
	if (interval.lower !== null) {
		if (segment.lower === null) return false;
		const compared = compareBounds(segment.lower.version, interval.lower.version);
		if (compared < 0 || compared === 0 && segment.lower.inclusive && !interval.lower.inclusive) return false;
	}
	if (interval.upper !== null) {
		if (segment.upper === null) return false;
		const compared = compareBounds(segment.upper.version, interval.upper.version);
		if (compared > 0 || compared === 0 && segment.upper.inclusive && !interval.upper.inclusive) return false;
	}
	return true;
}
function atomicVersionSegments(intervals) {
	const endpoints = [...new Set(intervals.flatMap((interval) => [interval.lower?.version, interval.upper?.version].filter((version) => version !== void 0)))].sort(compareBounds);
	if (endpoints.length === 0) return [{
		lower: null,
		upper: null
	}];
	const segments = [{
		lower: null,
		upper: {
			inclusive: false,
			version: endpoints[0]
		}
	}];
	for (let index = 0; index < endpoints.length; index += 1) {
		const endpoint = endpoints[index];
		segments.push({
			lower: {
				inclusive: true,
				version: endpoint
			},
			upper: {
				inclusive: true,
				version: endpoint
			}
		});
		const next = endpoints[index + 1];
		if (next !== void 0) segments.push({
			lower: {
				inclusive: false,
				version: endpoint
			},
			upper: {
				inclusive: false,
				version: next
			}
		});
	}
	segments.push({
		lower: {
			inclusive: false,
			version: endpoints.at(-1)
		},
		upper: null
	});
	return segments;
}
function sameIndexes(left, right) {
	return left.length === right.length && left.every((value, index) => value === right[index]);
}
function mergeSegments(segments) {
	const merged = [];
	for (const segment of segments) {
		const previous = merged.at(-1);
		if (previous && sameIndexes(previous.releaseIndexes, segment.releaseIndexes) && sameIndexes(previous.rollbackReleaseIndexes, segment.rollbackReleaseIndexes)) merged[merged.length - 1] = {
			...previous,
			upper: segment.upper
		};
		else merged.push(segment);
	}
	return merged;
}
function compileAppVersion(releases) {
	const ranges = /* @__PURE__ */ new Map();
	for (const release of releases) ranges.set(release.id, rangeToIntervals(release.targetAppVersion));
	const segmentReleases = atomicVersionSegments([...ranges.values()].flat()).map((segment) => {
		const applicable = releases.filter((release) => ranges.get(release.id).some((range) => intervalContainsSegment(range, segment)));
		return {
			rollbackIds: new Set(applicable.map(({ id }) => id)),
			segment,
			retainedIds: collectFrontierReleaseIds(applicable)
		};
	});
	const retainedIds = new Set(segmentReleases.flatMap(({ retainedIds, rollbackIds }) => [...retainedIds, ...rollbackIds]));
	const retainedReleases = releases.filter((release) => retainedIds.has(release.id));
	const descriptorIndex = new Map(retainedReleases.map((release, index) => [release.id, index]));
	const segments = mergeSegments(segmentReleases.map(({ segment, retainedIds, rollbackIds }) => ({
		...segment,
		releaseIndexes: releases.filter((release) => retainedIds.has(release.id)).map((release) => descriptorIndex.get(release.id)).filter((index) => index !== void 0),
		rollbackReleaseIndexes: releases.filter((release) => rollbackIds.has(release.id)).map((release) => descriptorIndex.get(release.id)).filter((index) => index !== void 0)
	}))).filter((segment) => segment.releaseIndexes.length > 0 || segment.rollbackReleaseIndexes.length > 0);
	return {
		envelope: {
			fallbackPolicy: _hot_updater_protocol.RELEASE_CATALOG_FALLBACK_POLICY,
			schemaVersion: _hot_updater_protocol.RELEASE_CATALOG_SCHEMA_VERSION,
			segments,
			strategy: "APP_VERSION"
		},
		retainedReleases
	};
}
function compileFingerprint(releases) {
	const retainedIds = collectFrontierReleaseIds(releases);
	const retainedReleases = releases;
	return {
		envelope: {
			fallbackPolicy: _hot_updater_protocol.RELEASE_CATALOG_FALLBACK_POLICY,
			releaseIndexes: retainedReleases.map((release, index) => retainedIds.has(release.id) ? index : -1).filter((index) => index >= 0),
			rollbackReleaseIndexes: retainedReleases.map((_, index) => index),
			schemaVersion: _hot_updater_protocol.RELEASE_CATALOG_SCHEMA_VERSION,
			strategy: "FINGERPRINT"
		},
		retainedReleases
	};
}
async function sha256(value) {
	const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
	return `sha256:${[...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
function canonicalStringify(value) {
	if (value === null || typeof value !== "object") return JSON.stringify(value);
	if (Array.isArray(value)) return `[${value.map(canonicalStringify).join(",")}]`;
	const record = value;
	return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${canonicalStringify(record[key])}`).join(",")}}`;
}
async function compileReleaseCatalog(input) {
	const releases = validateReleases(input.releases, input.strategy);
	const targetCohorts = new Set(releases.flatMap((release) => release.targetCohorts));
	if (targetCohorts.size > _hot_updater_protocol.MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE) throw new ReleaseCatalogCompilationError("DISTINCT_TARGET_COHORT_LIMIT", `Scope exceeds ${_hot_updater_protocol.MAX_DISTINCT_TARGET_COHORTS_PER_SCOPE} distinct target cohorts`);
	const { envelope, retainedReleases } = input.strategy === "APP_VERSION" ? compileAppVersion(releases) : compileFingerprint(releases);
	const payload = {
		...envelope,
		releaseDescriptors: retainedReleases.map(releaseDescriptor)
	};
	const canonicalPayload = canonicalStringify(payload);
	const byteSize = new TextEncoder().encode(canonicalPayload).byteLength;
	if (byteSize > _hot_updater_protocol.MAX_COMPILED_CATALOG_BYTES) throw new ReleaseCatalogCompilationError("CATALOG_OVERSIZE", `Compiled Release catalog is ${byteSize} bytes; maximum is ${_hot_updater_protocol.MAX_COMPILED_CATALOG_BYTES}`);
	return {
		byteSize,
		canonicalPayload,
		catalogHash: await sha256(canonicalPayload),
		diagnostics: {
			byteSize,
			descriptorCount: payload.releaseDescriptors.length,
			distinctTargetCohortCount: targetCohorts.size,
			releaseCount: releases.length,
			segmentCount: payload.strategy === "APP_VERSION" ? payload.segments.length : 1
		},
		payload
	};
}
function versionInSegment(version, segment) {
	if (segment.lower !== null) {
		const compared = compareBounds(version, segment.lower.version);
		if (compared < 0 || compared === 0 && !segment.lower.inclusive) return false;
	}
	if (segment.upper !== null) {
		const compared = compareBounds(version, segment.upper.version);
		if (compared > 0 || compared === 0 && !segment.upper.inclusive) return false;
	}
	return true;
}
function projectCompiledCatalog(catalog, appVersion) {
	let indexes;
	if (catalog.strategy === "FINGERPRINT") indexes = catalog.releaseIndexes;
	else {
		const canonicalVersion = appVersion && (0, _hot_updater_protocol.canonicalizeAppVersion)(appVersion);
		if (!canonicalVersion) return [];
		indexes = catalog.segments.find((segment) => versionInSegment(canonicalVersion, segment))?.releaseIndexes ?? [];
	}
	return indexes.map((index) => catalog.releaseDescriptors[index]);
}
function projectCompiledRollbackCatalog(catalog, appVersion) {
	let indexes;
	if (catalog.strategy === "FINGERPRINT") indexes = catalog.rollbackReleaseIndexes;
	else {
		const canonicalVersion = appVersion && (0, _hot_updater_protocol.canonicalizeAppVersion)(appVersion);
		if (!canonicalVersion) return [];
		indexes = catalog.segments.find((segment) => versionInSegment(canonicalVersion, segment))?.rollbackReleaseIndexes ?? [];
	}
	return indexes.map((index) => catalog.releaseDescriptors[index]);
}
function referenceCompatibleReleases(releases, appVersion) {
	const canonicalVersion = (0, _hot_updater_protocol.canonicalizeAppVersion)(appVersion);
	if (!canonicalVersion) return [];
	return releases.filter((release) => release.enabled && release.targetAppVersion !== null && require_range_DvX_Y6iv.f(canonicalVersion, release.targetAppVersion));
}
//#endregion
exports.ReleaseCatalogCompilationError = ReleaseCatalogCompilationError;
Object.defineProperty(exports, "canonicalizeAppVersion", {
	enumerable: true,
	get: function() {
		return _hot_updater_protocol.canonicalizeAppVersion;
	}
});
exports.compileReleaseCatalog = compileReleaseCatalog;
exports.projectCompiledCatalog = projectCompiledCatalog;
exports.projectCompiledRollbackCatalog = projectCompiledRollbackCatalog;
exports.referenceCompatibleReleases = referenceCompatibleReleases;
