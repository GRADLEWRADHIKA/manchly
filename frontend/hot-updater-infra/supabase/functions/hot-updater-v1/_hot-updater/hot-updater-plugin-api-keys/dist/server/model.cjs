let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/model.ts
const toRow = (row) => ({
	id: row.id,
	hash: row.hash,
	name: row.name,
	prefix: row.prefix,
	role: row.role,
	created_at_ms: row.created_at_ms,
	revoked_at_ms: row.revoked_at_ms
});
/** Today's `ApiKeyModel` on the engine: one unique read by hash, keyed writes. */
const createApiKeyModel = (db) => ({
	async create(row) {
		try {
			return await db.transaction(async (tx) => {
				if (await tx.findOne("api_keys", { hash: row.hash }) !== null) return "existing";
				tx.create("api_keys", row);
				return "created";
			});
		} catch (error) {
			if (error instanceof _hot_updater_plugin_core.DatabaseConstraintError && error.reason === "unique") return "existing";
			throw error;
		}
	},
	async findByHash(hash) {
		const row = await db.findOne("api_keys", { hash });
		return row === null ? null : toRow(row);
	},
	/** Every key, newest first, then by id; the whole list is the result. */
	async list() {
		const rows = [];
		let cursor;
		do {
			const page = await db.findMany("api_keys", {
				index: "byCreated",
				where: {},
				order: "desc",
				limit: 500,
				...cursor === void 0 ? {} : { cursor }
			});
			rows.push(...page.rows.map(toRow));
			cursor = page.next;
		} while (cursor !== void 0);
		return rows.sort((left, right) => right.created_at_ms - left.created_at_ms || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0));
	},
	revoke: ({ id, revokedAtMs }) => db.transaction(async (tx) => {
		const row = await tx.findOne("api_keys", { id });
		if (row === null) return null;
		tx.update("api_keys", row, { revoked_at_ms: revokedAtMs });
		return toRow({
			...row,
			revoked_at_ms: revokedAtMs
		});
	})
});
//#endregion
exports.createApiKeyModel = createApiKeyModel;
