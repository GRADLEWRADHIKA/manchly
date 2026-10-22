const require_databaseMetadata = require("./databaseMetadata.cjs");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/databaseRows.ts
const releaseToRow = (release, scopeKey) => ({
	id: release.id,
	revision: release.revision,
	scope_key: scopeKey,
	channel_id: release.channelId,
	platform: release.platform,
	kind: release.kind,
	bundle_id: release.bundleId,
	strategy: release.strategy,
	target_app_version: release.targetAppVersion,
	fingerprint_hash: release.fingerprintHash,
	enabled: release.enabled,
	should_force_update: release.shouldForceUpdate,
	message: release.message,
	rollout_cohort_count: release.rolloutCohortCount,
	target_cohorts: release.targetCohorts,
	operation: release.operation,
	source_release_id: release.sourceReleaseId,
	created_at_ms: release.createdAtMs,
	updated_at_ms: release.updatedAtMs
});
const releaseRowToRelease = (row) => ({
	id: row.id,
	revision: row.revision,
	channelId: row.channel_id,
	platform: row.platform,
	kind: row.kind,
	bundleId: row.bundle_id,
	strategy: row.strategy,
	targetAppVersion: row.target_app_version,
	fingerprintHash: row.fingerprint_hash,
	enabled: row.enabled,
	shouldForceUpdate: row.should_force_update,
	message: row.message,
	rolloutCohortCount: row.rollout_cohort_count,
	targetCohorts: row.target_cohorts,
	operation: row.operation,
	sourceReleaseId: row.source_release_id,
	createdAtMs: row.created_at_ms,
	updatedAtMs: row.updated_at_ms
});
const BundleRowHydrationErrorReason = {
	duplicatePatchId: "duplicate_patch_id",
	orphanPatchOwner: "orphan_patch_owner",
	orphanPatchBase: "orphan_patch_base"
};
var BundleRowHydrationError = class extends Error {
	name = "BundleRowHydrationError";
	reason;
	patchId;
	bundleId;
	constructor({ reason, patchId, bundleId }) {
		super(`Cannot hydrate bundle rows: ${reason} for patch "${patchId}" and bundle "${bundleId}".`);
		this.reason = reason;
		this.patchId = patchId;
		this.bundleId = bundleId;
	}
};
const bundleToRow = (bundle) => {
	const metadata = require_databaseMetadata.bundleMetadataToRow(bundle.metadata);
	return {
		id: bundle.id,
		platform: bundle.platform,
		git_commit_hash: bundle.gitCommitHash,
		metadata,
		manifest_storage_uri: (0, _hot_updater_protocol.getManifestStorageUri)(bundle),
		manifest_file_hash: (0, _hot_updater_protocol.getManifestFileHash)(bundle),
		asset_base_storage_uri: (0, _hot_updater_protocol.getAssetBaseStorageUri)(bundle)
	};
};
const bundleToPatchRows = (bundle) => (0, _hot_updater_protocol.getBundlePatches)(bundle).map((patch, orderIndex) => ({
	id: `${bundle.id}:${patch.baseBundleId}`,
	bundle_id: bundle.id,
	base_bundle_id: patch.baseBundleId,
	base_file_hash: patch.baseFileHash,
	patch_file_hash: patch.patchFileHash,
	patch_storage_uri: patch.patchStorageUri,
	byte_size: patch.byteSize,
	order_index: orderIndex
}));
const comparePatchRows = (left, right) => left.order_index - right.order_index || left.id.localeCompare(right.id);
const patchRowToArtifact = (row) => ({
	baseBundleId: row.base_bundle_id,
	baseFileHash: row.base_file_hash,
	byteSize: row.byte_size,
	patchFileHash: row.patch_file_hash,
	patchStorageUri: row.patch_storage_uri
});
const rowToBundle = (row, patchRows = []) => {
	const patches = patchRows.slice().sort(comparePatchRows).map(patchRowToArtifact);
	return {
		id: row.id,
		platform: row.platform,
		gitCommitHash: row.git_commit_hash,
		metadata: row.metadata,
		manifestStorageUri: row.manifest_storage_uri,
		manifestFileHash: row.manifest_file_hash,
		assetBaseStorageUri: row.asset_base_storage_uri,
		patches
	};
};
const rowsToBundles = (bundleRows, patchRows, referencedBundleRows) => {
	const ownerIds = new Set(bundleRows.map(({ id }) => id));
	const baseIds = new Set(ownerIds);
	for (const row of referencedBundleRows) baseIds.add(row.id);
	const patchIds = /* @__PURE__ */ new Set();
	const patchesByOwner = /* @__PURE__ */ new Map();
	for (const patch of patchRows) {
		if (patchIds.has(patch.id)) throw new BundleRowHydrationError({
			reason: BundleRowHydrationErrorReason.duplicatePatchId,
			patchId: patch.id,
			bundleId: patch.bundle_id
		});
		patchIds.add(patch.id);
		if (!ownerIds.has(patch.bundle_id)) throw new BundleRowHydrationError({
			reason: BundleRowHydrationErrorReason.orphanPatchOwner,
			patchId: patch.id,
			bundleId: patch.bundle_id
		});
		if (!baseIds.has(patch.base_bundle_id)) throw new BundleRowHydrationError({
			reason: BundleRowHydrationErrorReason.orphanPatchBase,
			patchId: patch.id,
			bundleId: patch.base_bundle_id
		});
		const ownerPatches = patchesByOwner.get(patch.bundle_id) ?? [];
		ownerPatches.push(patch);
		patchesByOwner.set(patch.bundle_id, ownerPatches);
	}
	return bundleRows.map((row) => rowToBundle(row, patchesByOwner.get(row.id) ?? []));
};
//#endregion
exports.BundleRowHydrationError = BundleRowHydrationError;
exports.BundleRowHydrationErrorReason = BundleRowHydrationErrorReason;
exports.bundleToPatchRows = bundleToPatchRows;
exports.bundleToRow = bundleToRow;
exports.releaseRowToRelease = releaseRowToRelease;
exports.releaseToRow = releaseToRow;
exports.rowToBundle = rowToBundle;
exports.rowsToBundles = rowsToBundles;
