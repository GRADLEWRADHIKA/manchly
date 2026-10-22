import { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, RemoteConfigValidationError, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, resolveRemoteConfigValues, validateRemoteConfigTemplate } from "./template.mjs";
import { RemoteConfigInputError, createRemoteConfigApi } from "./api.mjs";
import { markOfficial } from "./official.mjs";
import { createRemoteConfigEndpoints } from "./routes.mjs";
import { remoteConfigSchema } from "./schema.mjs";
import { createRemoteConfigAdminApi } from "./admin.mjs";
import { definePlugin } from "@hot-updater/plugin-core";
//#region src/server/index.ts
/**
* Remote Config: parameters whose values the server picks per device by
* conditions, published as versioned templates. Devices fetch their values
* from `GET /remote-config` with the `remoteConfig()` client plugin; the
* Console and `hotUpdater.api.remoteConfig` edit, publish, and roll back
* templates.
*/
const remoteConfig = () => {
	const plugin = definePlugin({
		id: "remoteConfig",
		namespace: false,
		schemaVersion: "1.0.0",
		schema: remoteConfigSchema,
		init: ({ db, now }) => {
			const api = createRemoteConfigApi({
				db,
				now
			});
			return {
				api,
				endpoints: createRemoteConfigEndpoints(api)
			};
		}
	});
	return markOfficial(plugin);
};
//#endregion
export { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, RemoteConfigInputError, RemoteConfigValidationError, createRemoteConfigAdminApi, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, remoteConfig, remoteConfigSchema, resolveRemoteConfigValues, validateRemoteConfigTemplate };
