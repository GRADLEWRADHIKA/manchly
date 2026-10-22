import { projectReleaseCatalogRow, releaseCatalogScopeKeyOf } from "../db/releaseCatalog.mjs";
import { resolveManifestArtifactFiles, resolveManifestArtifacts, resolveManifestArtifactsV2 } from "../db/updateArtifacts.mjs";
import { baseBundleIdsOf } from "./baseCandidates.mjs";
import { parseBaseCandidateKey, rowToBundle } from "@hot-updater/plugin-core";
import { ARTIFACT_FILES_PROTOCOL_VERSION, ARTIFACT_PROTOCOL_VERSION, NIL_UUID } from "@hot-updater/protocol";
//#region src/core/reads.ts
const PAGE = 500;
const pick = (fields) => (row) => Object.fromEntries(fields.map((field) => [field, row[field]]));
const toBundleRow = pick([
	"id",
	"platform",
	"git_commit_hash",
	"metadata",
	"manifest_storage_uri",
	"manifest_file_hash",
	"asset_base_storage_uri"
]);
const toPatchRow = pick([
	"id",
	"bundle_id",
	"base_bundle_id",
	"base_file_hash",
	"patch_file_hash",
	"patch_storage_uri",
	"byte_size",
	"order_index"
]);
const toReleaseRow = pick([
	"id",
	"revision",
	"scope_key",
	"channel_id",
	"platform",
	"kind",
	"bundle_id",
	"strategy",
	"target_app_version",
	"fingerprint_hash",
	"enabled",
	"should_force_update",
	"message",
	"rollout_cohort_count",
	"target_cohorts",
	"operation",
	"source_release_id",
	"created_at_ms",
	"updated_at_ms"
]);
const toCatalogRow = pick([
	"scope_key",
	"catalog_id",
	"strategy",
	"channel_id",
	"channel_key",
	"platform",
	"fingerprint_hash",
	"generation",
	"payload",
	"catalog_hash",
	"byte_size",
	"is_tombstone",
	"updated_at_ms"
]);
const toChannelRow = pick(["id", "name"]);
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
/** Core's reads, each through one declared index or key. */
const createCoreReads = (db, storage) => {
	/** A bundle row's patches, exactly as many as its reference counter holds. */
	const detail = async (row) => {
		const count = row._refs_bundle_patches_bundle_id ?? 0;
		const patches = [];
		let cursor;
		while (patches.length < count) {
			const page = await db.findMany("bundle_patches", {
				index: "byBundle",
				where: { bundle_id: row.id },
				limit: Math.min(count - patches.length, PAGE),
				...cursor === void 0 ? {} : { cursor }
			});
			patches.push(...page.rows.map(toPatchRow));
			if (page.next === void 0) break;
			cursor = page.next;
		}
		return {
			bundle: toBundleRow(row),
			patches,
			childCount: row._refs_bundle_patches_base_bundle_id ?? 0
		};
	};
	const after = (input) => input.after === void 0 ? {} : { range: (input.order ?? "asc") === "asc" ? { gt: input.after } : { lt: input.after } };
	return {
		/** The update check: one point read of its scope's catalog. */
		async getReleaseCatalog(input) {
			const scopeKey = releaseCatalogScopeKeyOf(input);
			const row = await db.findOne("release_catalogs", { scope_key: scopeKey });
			return projectReleaseCatalogRow(row === null ? null : toCatalogRow(row), input, scopeKey);
		},
		/** Artifact resolution: one batch read of both bundles and one unique read of their patch. */
		getArtifactInfo: (async (targetBundleId, currentBundleId, artifactProtocolVersion) => {
			const { readStorageText } = storage;
			if (artifactProtocolVersion !== ARTIFACT_PROTOCOL_VERSION && artifactProtocolVersion !== ARTIFACT_FILES_PROTOCOL_VERSION || readStorageText === void 0) return null;
			const withCurrent = currentBundleId !== NIL_UUID;
			const [[target, current], patch] = await Promise.all([db.findByKeys("bundles", withCurrent ? [{ id: targetBundleId }, { id: currentBundleId }] : [{ id: targetBundleId }]), withCurrent ? db.findOne("bundle_patches", {
				bundle_id: targetBundleId,
				base_bundle_id: currentBundleId
			}) : null]);
			if (target === null || target === void 0) return null;
			const input = {
				currentBundle: current ? rowToBundle(toBundleRow(current)) : null,
				readStorageText,
				resolveFileUrl: storage.resolveFileUrl,
				targetBundle: rowToBundle(toBundleRow(target), patch === null ? [] : [toPatchRow(patch)])
			};
			return artifactProtocolVersion === ARTIFACT_FILES_PROTOCOL_VERSION ? resolveManifestArtifactsV2(input) : resolveManifestArtifacts(input);
		}),
		/** A Bundle's file URLs: one point read of the bundle and its manifest. */
		async getArtifactFiles(bundleId, paths) {
			const { readStorageText } = storage;
			if (readStorageText === void 0) return null;
			const row = await db.findOne("bundles", { id: bundleId });
			if (row === null) return null;
			return resolveManifestArtifactFiles({
				paths,
				readStorageText,
				resolveFileUrl: storage.resolveFileUrl,
				targetBundle: rowToBundle(toBundleRow(row))
			});
		},
		/** A bundle, its patches, and how many patches start from it. */
		async getBundle(id) {
			const row = await db.findOne("bundles", { id });
			return row === null ? null : detail(row);
		},
		/** One page of the patches that start from a bundle, by target bundle id. */
		/** Each base bundle's reference counter: one batch read of the bundle rows, and no patches. */
		async countBundleChildren(baseBundleIds) {
			const ids = [...new Set(baseBundleIds)];
			if (ids.length === 0) return {};
			const rows = await db.findByKeys("bundles", ids.map((id) => ({ id })));
			return Object.fromEntries(ids.map((id, position) => [id, rows[position]?._refs_bundle_patches_base_bundle_id ?? 0]));
		},
		async listPatchesFromBase(baseBundleId, input) {
			return (await db.findMany("bundle_patches", {
				index: "byBase",
				where: { base_bundle_id: baseBundleId },
				order: input.order ?? "asc",
				limit: input.limit,
				...after(input)
			})).rows.map(toPatchRow);
		},
		/** One page of bundles with their patches, oldest or newest first, optionally for one platform. */
		async listBundles(input) {
			const page = input.platform === void 0 ? await db.findMany("bundles", {
				index: "all",
				where: {},
				order: input.order ?? "asc",
				limit: input.limit,
				...after(input)
			}) : await db.findMany("bundles", {
				index: "byPlatform",
				where: { platform: input.platform },
				order: input.order ?? "asc",
				limit: input.limit,
				...after(input)
			});
			return Promise.all(page.rows.map(detail));
		},
		/** Bundles in total or for one platform: one counter row. */
		async countBundles(platform) {
			const { rows } = await db.findAggregates("bundle_totals", {
				index: "byPlatform",
				where: { platform_key: platform ?? "*" },
				limit: 1
			});
			return rows[0]?.bundles ?? 0;
		},
		/** Auto-patch bases for a new bundle: one point read of its scope's catalog. */
		async findBaseBundleIds(candidateKey, bundleId, limit) {
			const query = parseBaseCandidateKey(candidateKey);
			if (query === null) return [];
			const row = await db.findOne("release_catalogs", { scope_key: query.scopeKey });
			return row === null ? [] : baseBundleIdsOf(toCatalogRow(row), query.range, bundleId, limit);
		},
		async getRelease(id) {
			const row = await db.findOne("releases", { id });
			return row === null ? null : toReleaseRow(row);
		},
		/** One page of releases through the index its filter names. */
		async listReleases(input) {
			const { filter } = input;
			const options = {
				order: input.order ?? "asc",
				limit: input.limit,
				...after(input)
			};
			return (filter.kind === "all" ? await db.findMany("releases", {
				index: "all",
				where: {},
				...options
			}) : filter.kind === "bundle" ? await db.findMany("releases", {
				index: "byBundle",
				where: { bundle_id: filter.bundleId },
				...options
			}) : filter.kind === "scope" ? filter.enabled === void 0 ? await db.findMany("releases", {
				index: "byScope",
				where: { scope_key: filter.scopeKey },
				...options
			}) : await db.findMany("releases", {
				index: "byScopeEnabled",
				where: {
					scope_key: filter.scopeKey,
					enabled: filter.enabled
				},
				...options
			}) : filter.enabled === void 0 ? await db.findMany("releases", {
				index: "byChannelPlatform",
				where: {
					channel_id: filter.channelId,
					platform: filter.platform
				},
				...options
			}) : await db.findMany("releases", {
				index: "byChannelPlatformEnabled",
				where: {
					channel_id: filter.channelId,
					platform: filter.platform,
					enabled: filter.enabled
				},
				...options
			})).rows.map(toReleaseRow);
		},
		/** A scope's newest release id: `byScope` descending, limit 1. */
		async latestReleaseId(scopeKey) {
			const { rows } = await db.findMany("releases", {
				index: "byScope",
				where: { scope_key: scopeKey },
				order: "desc",
				limit: 1
			});
			return rows[0]?.id ?? null;
		},
		async getReleaseCatalogRow(scopeKey) {
			const row = await db.findOne("release_catalogs", { scope_key: scopeKey });
			return row === null ? null : toCatalogRow(row);
		},
		async listReleaseCatalogs(input) {
			return (await db.findMany("release_catalogs", {
				index: "all",
				where: {},
				order: input.order ?? "asc",
				limit: input.limit,
				...after(input)
			})).rows.map(toCatalogRow);
		},
		/** Every channel, by name. */
		async listChannels() {
			return (await drain((page) => db.findMany("channels", {
				index: "all",
				where: {},
				limit: PAGE,
				...page
			}))).map(toChannelRow);
		},
		async findChannelByName(name) {
			const row = await db.findOne("channels", { name });
			return row === null ? null : toChannelRow(row);
		}
	};
};
//#endregion
export { createCoreReads, drain, toBundleRow, toCatalogRow, toChannelRow, toPatchRow, toReleaseRow };
