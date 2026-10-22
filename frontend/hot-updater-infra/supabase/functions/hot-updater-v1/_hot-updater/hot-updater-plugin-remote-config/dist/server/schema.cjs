let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/schema.ts
/**
* Remote Config's tables: the active template in one row, which a device's
* fetch reads by key, and every published version beside it.
*/
const remoteConfigSchema = {
	/** One row, `id` `"active"`: the template devices receive and its version. */
	remote_config_active: (0, _hot_updater_plugin_core.defineTable)({
		id: {
			type: "string",
			maxLength: 16
		},
		version: { type: "integer" },
		template: { type: "json" },
		updated_at_ms: { type: "integer" }
	}, { key: ["id"] }),
	/** Each publish and rollback, kept so the Console can show and restore it. */
	remote_config_versions: (0, _hot_updater_plugin_core.defineTable)({
		version: { type: "integer" },
		template: { type: "json" },
		description: {
			type: "string",
			maxLength: 256,
			required: false
		},
		/** `PUBLISH`, or `ROLLBACK` for a copy of `rollback_source`. */
		update_type: {
			type: "string",
			maxLength: 16
		},
		rollback_source: {
			type: "integer",
			required: false
		},
		created_at_ms: { type: "integer" }
	}, {
		key: ["version"],
		indexes: { byVersion: {
			eq: [],
			sort: ["version"]
		} }
	})
};
//#endregion
exports.remoteConfigSchema = remoteConfigSchema;
