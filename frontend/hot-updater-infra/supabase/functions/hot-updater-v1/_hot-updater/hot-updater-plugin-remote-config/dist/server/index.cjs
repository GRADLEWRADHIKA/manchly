Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const require_template = require("./template.cjs");
const require_api = require("./api.cjs");
const require_official = require("./official.cjs");
const require_routes = require("./routes.cjs");
const require_schema = require("./schema.cjs");
const require_admin = require("./admin.cjs");
let _hot_updater_plugin_core = require("@hot-updater/plugin-core");
//#region src/server/index.ts
/**
* Remote Config: parameters whose values the server picks per device by
* conditions, published as versioned templates. Devices fetch their values
* from `GET /remote-config` with the `remoteConfig()` client plugin; the
* Console and `hotUpdater.api.remoteConfig` edit, publish, and roll back
* templates.
*/
const remoteConfig = () => {
	const plugin = (0, _hot_updater_plugin_core.definePlugin)({
		id: "remoteConfig",
		namespace: false,
		schemaVersion: "1.0.0",
		schema: require_schema.remoteConfigSchema,
		init: ({ db, now }) => {
			const api = require_api.createRemoteConfigApi({
				db,
				now
			});
			return {
				api,
				endpoints: require_routes.createRemoteConfigEndpoints(api)
			};
		}
	});
	return require_official.markOfficial(plugin);
};
//#endregion
exports.EMPTY_REMOTE_CONFIG_TEMPLATE = require_template.EMPTY_REMOTE_CONFIG_TEMPLATE;
exports.REMOTE_CONFIG_MAX_CONDITIONS = require_template.REMOTE_CONFIG_MAX_CONDITIONS;
exports.REMOTE_CONFIG_MAX_PARAMETERS = require_template.REMOTE_CONFIG_MAX_PARAMETERS;
exports.REMOTE_CONFIG_MAX_TEMPLATE_LENGTH = require_template.REMOTE_CONFIG_MAX_TEMPLATE_LENGTH;
exports.RemoteConfigInputError = require_api.RemoteConfigInputError;
exports.RemoteConfigValidationError = require_template.RemoteConfigValidationError;
exports.createRemoteConfigAdminApi = require_admin.createRemoteConfigAdminApi;
exports.evaluateRemoteConfig = require_template.evaluateRemoteConfig;
exports.matchesRemoteConfigCondition = require_template.matchesRemoteConfigCondition;
exports.matchesRemoteConfigRule = require_template.matchesRemoteConfigRule;
exports.remoteConfig = remoteConfig;
exports.remoteConfigSchema = require_schema.remoteConfigSchema;
exports.resolveRemoteConfigValues = require_template.resolveRemoteConfigValues;
exports.validateRemoteConfigTemplate = require_template.validateRemoteConfigTemplate;
