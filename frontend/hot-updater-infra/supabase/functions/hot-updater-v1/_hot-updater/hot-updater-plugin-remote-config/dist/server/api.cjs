const require_template = require("./template.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/api.ts
const ACTIVE_ID = "active";
/** How long a server answers fetches from the active template it read last. */
const ACTIVE_CACHE_TTL_MS = 5e3;
const MAX_DESCRIPTION_LENGTH = 256;
const MAX_VERSIONS_PAGE = 100;
/**
* An argument the API refuses, such as a negative `baseVersion`; the admin
* routes answer it with `400`.
*/
var RemoteConfigInputError = class extends TypeError {
	name = "RemoteConfigInputError";
};
const normalizeDescription = (description) => {
	if (description === void 0 || description === null) return null;
	if (typeof description !== "string") throw new RemoteConfigInputError("A version description is text.");
	const trimmed = description.trim();
	if (trimmed.length > MAX_DESCRIPTION_LENGTH) throw new RemoteConfigInputError(`A version description holds up to ${MAX_DESCRIPTION_LENGTH} characters.`);
	return trimmed.length === 0 ? null : trimmed;
};
const requireVersionNumber = (value, name) => {
	if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) throw new RemoteConfigInputError(`${name} must be a non-negative integer.`);
	return value;
};
/** A template as its `json` column stores it; validation made it plain JSON. */
const toColumn = (template) => template;
const fromColumn = (value) => value;
const toVersion = (row) => Object.freeze({
	version: row.version,
	description: row.description,
	updateType: row.update_type === "ROLLBACK" ? "ROLLBACK" : "PUBLISH",
	rollbackSource: row.rollback_source,
	createdAtMs: row.created_at_ms
});
/** Remote Config's API over its tables. */
const createRemoteConfigApi = ({ db, now }) => {
	let cached = null;
	let loading = null;
	let generation = 0;
	const readActive = async () => {
		const row = await db.findOne("remote_config_active", { id: ACTIVE_ID });
		return row === null ? {
			version: 0,
			template: require_template.EMPTY_REMOTE_CONFIG_TEMPLATE,
			updatedAtMs: null
		} : {
			version: row.version,
			template: fromColumn(row.template),
			updatedAtMs: row.updated_at_ms
		};
	};
	/** The active template for fetches: one read per server every few seconds at most. */
	const servedActive = () => {
		if (cached !== null && cached.expiresAt > now()) return Promise.resolve(cached.active);
		if (loading !== null) return loading;
		const started = generation;
		const read = readActive().then((active) => {
			if (generation === started) cached = {
				active,
				expiresAt: now() + ACTIVE_CACHE_TTL_MS
			};
			return active;
		}).finally(() => {
			if (loading === read) loading = null;
		});
		loading = read;
		return read;
	};
	const commit = async (input) => {
		const attempt = () => db.transaction(async (tx) => {
			const active = await tx.findOne("remote_config_active", { id: ACTIVE_ID });
			const currentVersion = active?.version ?? 0;
			if (currentVersion !== input.baseVersion) return {
				status: "conflict",
				currentVersion
			};
			const version = currentVersion + 1;
			const at = now();
			const row = {
				version,
				template: toColumn(input.template),
				description: input.description,
				update_type: input.rollbackSource === null ? "PUBLISH" : "ROLLBACK",
				rollback_source: input.rollbackSource,
				created_at_ms: at
			};
			tx.create("remote_config_versions", row);
			if (active === null) tx.create("remote_config_active", {
				id: ACTIVE_ID,
				version,
				template: toColumn(input.template),
				updated_at_ms: at
			});
			else tx.update("remote_config_active", active, {
				version,
				template: toColumn(input.template),
				updated_at_ms: at
			});
			return {
				status: "published",
				version: toVersion(row)
			};
		});
		try {
			const result = await attempt();
			if (result.status === "published") {
				generation += 1;
				cached = null;
				loading = null;
			}
			return result;
		} catch (error) {
			if (error instanceof _hot_updater_plugin_core.DatabaseConstraintError && (error.reason === "exists" || error.reason === "unique")) return {
				status: "conflict",
				currentVersion: (await readActive()).version
			};
			throw error;
		}
	};
	return Object.freeze({
		getActive: readActive,
		publish: async ({ template, baseVersion, description }) => commit({
			template: require_template.validateRemoteConfigTemplate(template),
			baseVersion: requireVersionNumber(baseVersion, "baseVersion"),
			description: normalizeDescription(description),
			rollbackSource: null
		}),
		rollback: async ({ version, baseVersion, description }) => {
			const source = await db.findOne("remote_config_versions", { version: requireVersionNumber(version, "version") });
			if (source === null) return { status: "not_found" };
			return commit({
				template: fromColumn(source.template),
				baseVersion: requireVersionNumber(baseVersion, "baseVersion"),
				description: normalizeDescription(description) ?? `Rollback to version ${source.version}`,
				rollbackSource: source.version
			});
		},
		listVersions: async ({ limit = 20, cursor } = {}) => {
			if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_VERSIONS_PAGE) throw new RemoteConfigInputError(`limit must be an integer from 1 to ${MAX_VERSIONS_PAGE}.`);
			const page = await db.findMany("remote_config_versions", {
				index: "byVersion",
				where: {},
				order: "desc",
				limit,
				...cursor === void 0 ? {} : { cursor }
			});
			return Object.freeze({
				versions: Object.freeze(page.rows.map(toVersion)),
				...page.next === void 0 ? {} : { next: page.next }
			});
		},
		getVersion: async (version) => {
			const row = await db.findOne("remote_config_versions", { version: requireVersionNumber(version, "version") });
			return row === null ? null : Object.freeze({
				...toVersion(row),
				template: fromColumn(row.template)
			});
		},
		resolve: async (context) => {
			const active = await servedActive();
			return {
				version: active.version,
				values: require_template.resolveRemoteConfigValues(active.template, {
					...context,
					now: context.now ?? now()
				})
			};
		}
	});
};
//#endregion
exports.RemoteConfigInputError = RemoteConfigInputError;
exports.createRemoteConfigApi = createRemoteConfigApi;
