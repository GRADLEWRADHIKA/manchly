import { toCatalogRow, toReleaseRow } from "./reads.mjs";
import { insertBundle } from "./writes.mjs";
import { ReleaseCatalogMutationError, compileReleaseCatalog, createUUIDv7, createUUIDv7After, isUUIDv7, releaseRowToRelease } from "@hot-updater/plugin-core";
import { createReleaseCatalogScopeKey, encodeChannelKey } from "@hot-updater/protocol";
//#region src/core/releases.ts
const PAGE = 500;
const fail = (code, message) => {
	throw new ReleaseCatalogMutationError(code, message);
};
const checkScope = (scope) => {
	const channelKey = encodeChannelKey(scope.channelName);
	const expected = scope.strategy === "APP_VERSION" ? createReleaseCatalogScopeKey({
		channelKey,
		platform: scope.platform,
		strategy: "APP_VERSION"
	}) : createReleaseCatalogScopeKey({
		channelKey,
		fingerprintHash: scope.fingerprintHash ?? "",
		platform: scope.platform,
		strategy: "FINGERPRINT"
	});
	if (scope.strategy === "FINGERPRINT" !== (scope.fingerprintHash !== null) || scope.scopeKey !== expected) fail("INVALID_SCOPE", "Release catalog scope metadata is inconsistent");
};
/** A scope's enabled releases, all of them, under the catalog's guard. */
const enabledReleases = async (tx, scopeKey) => {
	const rows = [];
	let cursor;
	do {
		const page = await tx.findMany("releases", {
			index: "byScopeEnabled",
			where: {
				scope_key: scopeKey,
				enabled: true
			},
			limit: PAGE,
			...cursor === void 0 ? {} : { cursor }
		});
		rows.push(...page.rows.map(toReleaseRow));
		cursor = page.next;
	} while (cursor !== void 0);
	return rows;
};
/** The scope's newest release id: `byScope` descending, limit 1. */
const latestReleaseId = async (tx, scopeKey) => {
	const { rows } = await tx.findMany("releases", {
		index: "byScope",
		where: { scope_key: scopeKey },
		order: "desc",
		limit: 1
	});
	return rows[0]?.id ?? null;
};
/** Compiles `enabled` and writes it as the scope's next catalog generation. */
const writeCatalog = async (tx, scope, stored, enabled, updatedAtMs) => {
	const compilation = await compileReleaseCatalog({
		strategy: scope.strategy,
		releases: enabled.map(releaseRowToRelease)
	});
	const generation = (stored.generation ?? 0) + 1;
	if (!Number.isSafeInteger(generation)) fail("CATALOG_GENERATION_EXHAUSTED", `Catalog "${scope.scopeKey}" exhausted its generation counter`);
	const catalog = {
		scope_key: scope.scopeKey,
		catalog_id: stored.catalog?.catalog_id ?? createUUIDv7(),
		strategy: scope.strategy,
		channel_id: scope.channelId,
		channel_key: encodeChannelKey(scope.channelName),
		platform: scope.platform,
		fingerprint_hash: scope.fingerprintHash,
		generation,
		payload: compilation.canonicalPayload,
		catalog_hash: compilation.catalogHash,
		byte_size: compilation.byteSize,
		is_tombstone: compilation.payload.releaseDescriptors.length === 0,
		updated_at_ms: updatedAtMs
	};
	const { scope_key: _scopeKey, ...set } = catalog;
	if (stored.row === null) tx.create("release_catalogs", catalog);
	else tx.update("release_catalogs", stored.row, set);
	return {
		catalog,
		compilation
	};
};
/** The scope's catalog row, and its compiled catalog and generation if it has one. */
const readCatalog = async (tx, scopeKey) => {
	const row = await tx.findOne("release_catalogs", { scope_key: scopeKey });
	return {
		row,
		generation: row?.generation ?? null,
		catalog: row === null ? null : toCatalogRow(row)
	};
};
/** A scope with releases and no compiled catalog lost its history. */
const assertHistory = (stored, hasReleases) => {
	if (stored.catalog === null && hasReleases) fail("CATALOG_IDENTITY_MISSING", "Catalog history is missing. Restore its catalog row from backup before rebuilding or deploying.");
};
/** One release change and its scope's next catalog, inside `tx`. */
const changeRelease = async (tx, { scope, change, bundle, updatedAtMs }) => {
	checkScope(scope);
	const stored = await readCatalog(tx, scope.scopeKey);
	const enabled = await enabledReleases(tx, scope.scopeKey);
	if (bundle !== void 0) {
		insertBundle(tx, bundle.row);
		for (const patch of bundle.patches) tx.create("bundle_patches", patch);
	}
	let before = null;
	let release;
	if (change.operation === "insert") {
		const latest = await latestReleaseId(tx, scope.scopeKey);
		assertHistory(stored, latest !== null);
		const floor = [latest, bundle && isUUIDv7(bundle.row.id) ? bundle.row.id : null].filter((id) => id !== null).sort().at(-1);
		const id = change.row.id ?? createUUIDv7After(floor ?? null);
		if (latest !== null && id <= latest) fail("NON_MONOTONIC_RELEASE_ID", `Release "${id}" must sort after "${latest}"`);
		release = {
			...change.row,
			id
		};
		if (release.scope_key !== scope.scopeKey || release.channel_id !== scope.channelId || release.platform !== scope.platform || release.strategy !== scope.strategy || release.fingerprint_hash !== scope.fingerprintHash || release.revision !== 1) fail("INVALID_SCOPE", "Inserted Release does not match its catalog scope");
		tx.create("releases", release);
	} else {
		const row = await tx.findOne("releases", { id: change.id });
		if (row === null || row.scope_key !== scope.scopeKey) return fail("RELEASE_NOT_FOUND", `Release "${change.id}" was not found in scope "${scope.scopeKey}"`);
		assertHistory(stored, true);
		before = toReleaseRow(row);
		if (change.operation === "delete") {
			await tx.delete("releases", row);
			release = null;
		} else {
			const set = {
				...change.update,
				revision: before.revision + 1
			};
			tx.update("releases", row, set);
			release = {
				...before,
				...set
			};
		}
	}
	const changedId = before?.id ?? release?.id;
	const next = [...enabled.filter(({ id }) => id !== changedId), ...release?.enabled ? [release] : []].sort((left, right) => left.id < right.id ? -1 : 1);
	const { catalog, compilation } = await writeCatalog(tx, scope, stored, next, updatedAtMs);
	return {
		catalog,
		release,
		diagnostics: compilation.diagnostics
	};
};
/**
* Release changes rooted at their catalogs: each reads its scope's catalog
* and enabled releases, applies the change, and writes the next catalog
* generation, all in one transaction. A concurrent change in a scope bumps
* its catalog row, so this transaction reruns instead of publishing a stale
* catalog.
*/
const changeReleases = (db, inputs) => {
	if (new Set(inputs.map(({ scope }) => scope.scopeKey)).size !== inputs.length) fail("INVALID_SCOPE", "A batch cannot change one catalog scope twice");
	return db.transaction(async (tx) => {
		const results = [];
		for (const input of inputs) results.push(await changeRelease(tx, input));
		return results;
	});
};
/** Recompiles a scope's catalog from its enabled releases inside `tx`; an unchanged catalog is not rewritten. */
const rebuildScope = async (tx, scope, updatedAtMs) => {
	checkScope(scope);
	const stored = await readCatalog(tx, scope.scopeKey);
	assertHistory(stored, await latestReleaseId(tx, scope.scopeKey) !== null);
	const enabled = await enabledReleases(tx, scope.scopeKey);
	const compilation = await compileReleaseCatalog({
		strategy: scope.strategy,
		releases: enabled.map(releaseRowToRelease)
	});
	const current = stored.catalog;
	if (current !== null && current.strategy === scope.strategy && current.channel_id === scope.channelId && current.channel_key === encodeChannelKey(scope.channelName) && current.platform === scope.platform && current.fingerprint_hash === scope.fingerprintHash && current.catalog_hash === compilation.catalogHash) return {
		catalog: current,
		current,
		changed: false,
		diagnostics: compilation.diagnostics
	};
	const written = await writeCatalog(tx, scope, stored, enabled, updatedAtMs);
	return {
		catalog: written.catalog,
		current,
		changed: true,
		diagnostics: written.compilation.diagnostics
	};
};
//#endregion
export { changeRelease, changeReleases, readCatalog, rebuildScope };
