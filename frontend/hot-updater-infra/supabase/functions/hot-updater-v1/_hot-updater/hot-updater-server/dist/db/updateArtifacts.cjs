let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
let _hot_updater_protocol = require("@hot-updater/protocol");
//#region src/db/updateArtifacts.ts
const HBC_ASSET_PATH_RE = /\.bundle$/;
const asByteSize = (value) => typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : null;
const resolveUniqueHbcAssetPath = (manifest) => {
	const candidates = Object.keys(manifest.assets).sort((left, right) => left.localeCompare(right)).filter((candidate) => HBC_ASSET_PATH_RE.test(candidate));
	return candidates.length === 1 ? candidates[0] : null;
};
const isBundleManifest = (value) => {
	if (!value || typeof value !== "object" || Array.isArray(value)) return false;
	const manifest = value;
	if (typeof manifest.bundleId !== "string") return false;
	if (!manifest.assets || typeof manifest.assets !== "object") return false;
	return Object.values(manifest.assets).every((asset) => {
		if (!asset || typeof asset !== "object" || Array.isArray(asset)) return false;
		const manifestAsset = asset;
		return typeof manifestAsset.fileHash === "string" && (manifestAsset.signature === void 0 || typeof manifestAsset.signature === "string");
	});
};
async function fetchBundleManifest(storageUri, readStorageText) {
	const storageText = await readStorageText(storageUri);
	if (storageText === null) return null;
	let payload;
	try {
		payload = JSON.parse(storageText);
	} catch {
		return null;
	}
	if (!isBundleManifest(payload)) return null;
	return payload;
}
function resolveHbcPatchPlan({ currentBundle, targetBundle, targetManifest }) {
	const matchingPatch = currentBundle ? (0, _hot_updater_protocol.getBundlePatch)(targetBundle, currentBundle.id) : null;
	const patchAssetPath = resolveUniqueHbcAssetPath(targetManifest);
	if (!currentBundle || !matchingPatch || !patchAssetPath || !matchingPatch.patchStorageUri || !matchingPatch.patchFileHash || !matchingPatch.baseFileHash) return null;
	return {
		assetPath: patchAssetPath,
		patch: {
			baseBundleId: matchingPatch.baseBundleId,
			baseFileHash: matchingPatch.baseFileHash,
			byteSize: asByteSize(matchingPatch.byteSize),
			patchFileHash: matchingPatch.patchFileHash,
			storageUri: matchingPatch.patchStorageUri
		}
	};
}
function createManifestArtifactPlan({ assetBaseStorageUri, currentBundle, targetBundle, targetManifest }) {
	const patchCandidate = resolveHbcPatchPlan({
		currentBundle,
		targetBundle,
		targetManifest
	});
	return { assets: Object.entries(targetManifest.assets).map(([assetPath, asset]) => {
		const downloadByteSize = asByteSize(asset.downloadByteSize);
		const downloadPath = (0, _hot_updater_plugin_core.getManifestAssetDownloadPath)(assetPath);
		const isTransformedDownload = downloadPath !== assetPath;
		const hasValidDownloadFileHash = (0, _hot_updater_plugin_core.isContentAddressedAssetFileHash)(asset.downloadFileHash);
		const file = {
			byteSize: downloadByteSize !== null && (hasValidDownloadFileHash || !isTransformedDownload && asset.downloadFileHash === void 0) ? downloadByteSize : null,
			storageUri: (0, _hot_updater_plugin_core.resolveManifestAssetStorageUri)({
				assetBaseStorageUri,
				assetPath: downloadPath,
				downloadFileHash: asset.downloadFileHash,
				fileHash: asset.fileHash
			})
		};
		if (isTransformedDownload) file.compression = "br";
		const patch = patchCandidate?.assetPath === assetPath ? patchCandidate.patch : null;
		return {
			assetPath,
			file,
			fileHash: asset.fileHash,
			patch
		};
	}) };
}
async function resolveAssets(plan, resolveFileUrl) {
	const patchAsset = plan.assets.find((asset) => asset.patch !== null);
	let resolvedPatch = null;
	if (patchAsset?.patch) {
		const patchUrl = await resolveFileUrl(patchAsset.patch.storageUri);
		if (patchUrl) resolvedPatch = {
			assetPath: patchAsset.assetPath,
			patch: {
				algorithm: "bsdiff",
				baseBundleId: patchAsset.patch.baseBundleId,
				baseFileHash: patchAsset.patch.baseFileHash,
				patchFileHash: patchAsset.patch.patchFileHash,
				patchUrl,
				...patchAsset.patch.byteSize === null ? {} : { byteSize: patchAsset.patch.byteSize }
			}
		};
	}
	const entries = await Promise.all(plan.assets.map(async (asset) => {
		let patch = resolvedPatch?.assetPath === asset.assetPath ? resolvedPatch.patch : null;
		let fileUrl = null;
		try {
			fileUrl = await resolveFileUrl(asset.file.storageUri);
		} catch (error) {
			if (!patch) throw error;
		}
		if (fileUrl && patch && asset.file.byteSize !== null && asset.patch !== null && asset.patch.byteSize !== null && asset.patch.byteSize >= asset.file.byteSize) patch = null;
		if (!fileUrl) return null;
		const changedAsset = {
			file: { url: fileUrl },
			fileHash: asset.fileHash
		};
		if (asset.file.compression) changedAsset.file.compression = asset.file.compression;
		if (patch) changedAsset.patch = patch;
		return { asset: [asset.assetPath, changedAsset] };
	}));
	if (entries.some((entry) => entry === null)) return null;
	const resolvedEntries = entries.filter((entry) => entry !== null);
	return { assets: Object.fromEntries(resolvedEntries.map((entry) => entry.asset)) };
}
/**
* Legacy: artifact protocol v1. Signs a URL for every file of the target, which grows with the
* Bundle's file count; apps whose SDK predates protocol v2 still ask for it.
* Remove with the `/artifacts/v1` route once no supported app uses it.
*/
async function resolveManifestArtifacts({ currentBundle, resolveFileUrl, readStorageText, targetBundle }) {
	const manifestStorageUri = targetBundle ? (0, _hot_updater_protocol.getManifestStorageUri)(targetBundle) : null;
	const manifestFileHash = targetBundle ? (0, _hot_updater_protocol.getManifestFileHash)(targetBundle) : null;
	const assetBaseStorageUri = targetBundle ? (0, _hot_updater_protocol.getAssetBaseStorageUri)(targetBundle) : null;
	if (!targetBundle || !manifestStorageUri || !manifestFileHash || !assetBaseStorageUri) return null;
	const targetManifest = await fetchBundleManifest(manifestStorageUri, readStorageText);
	if (!targetManifest) return null;
	const plan = createManifestArtifactPlan({
		assetBaseStorageUri,
		currentBundle,
		targetBundle,
		targetManifest
	});
	const manifestUrl = await resolveFileUrl(manifestStorageUri);
	if (!manifestUrl) return null;
	const resolved = await resolveAssets(plan, resolveFileUrl);
	if (!resolved) return null;
	let archiveUrl = null;
	const archive = targetManifest.archive;
	if (archive && (0, _hot_updater_plugin_core.isContentAddressedAssetFileHash)(archive.downloadFileHash) && (asByteSize(archive.downloadByteSize) ?? 0) > 0 && (asByteSize(archive.tarByteSize) ?? 0) > 0) try {
		archiveUrl = await resolveFileUrl((0, _hot_updater_plugin_core.getBundleArchiveStorageUri)({
			manifestStorageUri,
			bundleId: targetBundle.id
		}));
	} catch {}
	return {
		artifactProtocolVersion: _hot_updater_protocol.ARTIFACT_PROTOCOL_VERSION,
		assets: resolved.assets,
		manifestFileHash,
		manifestUrl,
		...archiveUrl ? { archiveUrl } : {}
	};
}
/** The target's manifest and its plan, or null for a Bundle without one. */
async function loadTargetPlan({ currentBundle, readStorageText, targetBundle }) {
	const manifestStorageUri = (0, _hot_updater_protocol.getManifestStorageUri)(targetBundle);
	const manifestFileHash = (0, _hot_updater_protocol.getManifestFileHash)(targetBundle);
	const assetBaseStorageUri = (0, _hot_updater_protocol.getAssetBaseStorageUri)(targetBundle);
	if (!manifestStorageUri || !manifestFileHash || !assetBaseStorageUri) return null;
	const targetManifest = await fetchBundleManifest(manifestStorageUri, readStorageText);
	if (!targetManifest) return null;
	return {
		manifestFileHash,
		manifestStorageUri,
		plan: createManifestArtifactPlan({
			assetBaseStorageUri,
			currentBundle,
			targetBundle,
			targetManifest
		}),
		targetManifest
	};
}
/**
* Artifact protocol v2: the manifest, the archive, and the one Hermes patch,
* but no URL per file. A device asks {@link resolveManifestArtifactFiles}
* for the files it downloads one by one, so signing and the response stay
* the same size however many files the Bundle has.
*/
async function resolveManifestArtifactsV2({ currentBundle, resolveFileUrl, readStorageText, targetBundle }) {
	const target = await loadTargetPlan({
		currentBundle,
		readStorageText,
		targetBundle
	});
	if (!target) return null;
	const manifestUrl = await resolveFileUrl(target.manifestStorageUri);
	if (!manifestUrl) return null;
	const patched = target.plan.assets.find((asset) => asset.patch !== null);
	let patch;
	if (patched?.patch && !(patched.file.byteSize !== null && patched.patch.byteSize !== null && patched.patch.byteSize >= patched.file.byteSize)) try {
		const patchUrl = await resolveFileUrl(patched.patch.storageUri);
		if (patchUrl) patch = {
			algorithm: "bsdiff",
			assetPath: patched.assetPath,
			baseBundleId: patched.patch.baseBundleId,
			baseFileHash: patched.patch.baseFileHash,
			patchFileHash: patched.patch.patchFileHash,
			patchUrl,
			...patched.patch.byteSize === null ? {} : { byteSize: patched.patch.byteSize }
		};
	} catch {}
	let archiveUrl = null;
	const archive = target.targetManifest.archive;
	if (archive && (0, _hot_updater_plugin_core.isContentAddressedAssetFileHash)(archive.downloadFileHash) && (asByteSize(archive.downloadByteSize) ?? 0) > 0 && (asByteSize(archive.tarByteSize) ?? 0) > 0) try {
		archiveUrl = await resolveFileUrl((0, _hot_updater_plugin_core.getBundleArchiveStorageUri)({
			manifestStorageUri: target.manifestStorageUri,
			bundleId: targetBundle.id
		}));
	} catch {}
	return {
		artifactProtocolVersion: _hot_updater_protocol.ARTIFACT_FILES_PROTOCOL_VERSION,
		manifestFileHash: target.manifestFileHash,
		manifestUrl,
		...archiveUrl ? { archiveUrl } : {},
		...patch ? { patch } : {}
	};
}
/**
* Download URLs for the files a device downloads one by one. Only paths the
* target's manifest names are signed, at most
* {@link ARTIFACT_FILES_REQUEST_LIMIT}; null when any path is unknown or a
* URL cannot be resolved.
*/
async function resolveManifestArtifactFiles({ paths, resolveFileUrl, readStorageText, targetBundle }) {
	if (paths.length === 0 || paths.length > _hot_updater_protocol.ARTIFACT_FILES_REQUEST_LIMIT || new Set(paths).size !== paths.length) return null;
	const target = await loadTargetPlan({
		currentBundle: null,
		readStorageText,
		targetBundle
	});
	if (!target) return null;
	const planned = new Map(target.plan.assets.map((asset) => [asset.assetPath, asset]));
	const requested = paths.map((path) => planned.get(path));
	if (requested.some((asset) => asset === void 0)) return null;
	const files = await Promise.all(requested.map(async (asset) => {
		const url = await resolveFileUrl(asset.file.storageUri);
		if (!url) return null;
		const file = { url };
		if (asset.file.compression) file.compression = asset.file.compression;
		return [asset.assetPath, file];
	}));
	if (files.some((file) => file === null)) return null;
	return { files: Object.fromEntries(files.filter((file) => file !== null)) };
}
//#endregion
exports.resolveManifestArtifactFiles = resolveManifestArtifactFiles;
exports.resolveManifestArtifacts = resolveManifestArtifacts;
exports.resolveManifestArtifactsV2 = resolveManifestArtifactsV2;
