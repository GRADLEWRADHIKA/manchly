const require_reads = require("./reads.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/core/writes.ts
const PAGE = 500;
/** Moves one bundle into or out of its platform's total and the overall total. */
const countBundle = (tx, platform, delta) => {
	for (const key of [platform, "*"]) tx.aggregate("bundle_totals", { platform_key: key }, { bundles: delta });
};
const insertBundle = (tx, row) => {
	tx.create("bundles", row);
	countBundle(tx, row.platform, 1);
};
const updateBundle = (tx, current, set) => {
	tx.update("bundles", current, set);
	if (set.platform !== void 0 && set.platform !== current.platform) {
		countBundle(tx, current.platform, -1);
		countBundle(tx, set.platform, 1);
	}
};
/** Deletes a bundle and, by cascade, every patch to or from it; a release on it refuses. */
const deleteBundle = async (tx, current) => {
	await tx.delete("bundles", current);
	countBundle(tx, current.platform, -1);
};
/**
* Replaces a bundle's patches with `rows`: kept patches are updated where
* they changed, others deleted or created, so no key is written twice.
*/
const replaceBundlePatches = async (tx, bundle, rows) => {
	const wanted = new Map(rows.map((row) => [row.id, row]));
	const count = bundle._refs_bundle_patches_bundle_id ?? 0;
	let cursor;
	for (let seen = 0; seen < count;) {
		const page = await tx.findMany("bundle_patches", {
			index: "byBundle",
			where: { bundle_id: bundle.id },
			limit: Math.min(count - seen, PAGE),
			...cursor === void 0 ? {} : { cursor }
		});
		for (const stored of page.rows) {
			const next = wanted.get(stored.id);
			wanted.delete(stored.id);
			if (next === void 0) {
				await tx.delete("bundle_patches", stored);
				continue;
			}
			const set = Object.fromEntries(Object.entries(next).filter(([field, value]) => field !== "id" && stored[field] !== value));
			if (Object.keys(set).length > 0) tx.update("bundle_patches", stored, set);
		}
		seen += page.rows.length;
		if (page.next === void 0) break;
		cursor = page.next;
	}
	for (const row of wanted.values()) tx.create("bundle_patches", row);
};
/** A channel by name, created when missing; a concurrent creator's row is returned instead. */
const insertChannel = async (db, row) => {
	for (let attempt = 1;; attempt += 1) try {
		return await db.transaction(async (tx) => {
			const existing = await tx.findOne("channels", { name: row.name });
			if (existing !== null) return {
				row: require_reads.toChannelRow(existing),
				inserted: false
			};
			tx.create("channels", row);
			return {
				row,
				inserted: true
			};
		});
	} catch (error) {
		if (attempt < 3 && error instanceof _hot_updater_plugin_core.DatabaseConstraintError && (error.reason === "unique" || error.reason === "exists")) continue;
		throw error;
	}
};
/** Deletes a channel no release uses: 1 read + 1 write. */
const deleteChannel = (db, id) => db.transaction(async (tx) => {
	const row = await tx.findOne("channels", { id });
	if (row === null) return {
		deleted: false,
		reason: "not_found"
	};
	if ((row._refs_releases_channel_id ?? 0) > 0) return {
		deleted: false,
		reason: "not_empty"
	};
	await tx.delete("channels", row);
	return { deleted: true };
});
//#endregion
exports.deleteBundle = deleteBundle;
exports.deleteChannel = deleteChannel;
exports.insertBundle = insertBundle;
exports.insertChannel = insertChannel;
exports.replaceBundlePatches = replaceBundlePatches;
exports.updateBundle = updateBundle;
