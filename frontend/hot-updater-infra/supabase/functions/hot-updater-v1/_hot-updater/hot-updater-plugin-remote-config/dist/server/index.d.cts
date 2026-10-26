import { RemoteConfigDeviceContext, RemoteConfigFetchResponse } from "../shared/wire.cjs";
import { RemoteConfigSchema, remoteConfigSchema } from "./schema.cjs";
import { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, RemoteConfigCondition, RemoteConfigEvaluatedParameter, RemoteConfigEvaluationContext, RemoteConfigParameter, RemoteConfigParameterValue, RemoteConfigRule, RemoteConfigRuleType, RemoteConfigTemplate, RemoteConfigTemplateIssue, RemoteConfigValidationError, RemoteConfigValueType, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, resolveRemoteConfigValues, validateRemoteConfigTemplate } from "./template.cjs";
import { RemoteConfigActive, RemoteConfigApi, RemoteConfigInputError, RemoteConfigPublishResult, RemoteConfigVersion, RemoteConfigVersionDetail, RemoteConfigVersionsPage } from "./api.cjs";
import { RemoteConfigAdminApi, RemoteConfigAdminApiOptions, createRemoteConfigAdminApi } from "./admin.cjs";
//#region src/server/index.d.ts
/**
 * Remote Config: parameters whose values the server picks per device by
 * conditions, published as versioned templates. Devices fetch their values
 * from `GET /remote-config` with the `remoteConfig()` client plugin; the
 * Console and `hotUpdater.api.remoteConfig` edit, publish, and roll back
 * templates.
 */
declare const remoteConfig: () => import("@hot-updater/plugin-core").HotUpdaterPlugin<"remoteConfig", {
  readonly remote_config_active: import("@hot-updater/plugin-core").TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly version: {
      readonly type: "integer";
    };
    readonly template: {
      readonly type: "json";
    };
    readonly updated_at_ms: {
      readonly type: "integer";
    };
  }, {}, {}, readonly ["id"]>;
  readonly remote_config_versions: import("@hot-updater/plugin-core").TableDefinition<{
    readonly version: {
      readonly type: "integer";
    };
    readonly template: {
      readonly type: "json";
    };
    readonly description: {
      readonly type: "string";
      readonly maxLength: 256;
      readonly required: false;
    };
    readonly update_type: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly rollback_source: {
      readonly type: "integer";
      readonly required: false;
    };
    readonly created_at_ms: {
      readonly type: "integer";
    };
  }, {}, {
    readonly byVersion: {
      readonly eq: readonly [];
      readonly sort: readonly ["version"];
    };
  }, readonly ["version"]>;
}, {
  api: RemoteConfigApi;
  endpoints: readonly import("@hot-updater/plugin-core").PluginEndpoint[];
}, {}>;
//#endregion
export { EMPTY_REMOTE_CONFIG_TEMPLATE, REMOTE_CONFIG_MAX_CONDITIONS, REMOTE_CONFIG_MAX_PARAMETERS, REMOTE_CONFIG_MAX_TEMPLATE_LENGTH, type RemoteConfigActive, type RemoteConfigAdminApi, type RemoteConfigAdminApiOptions, type RemoteConfigApi, type RemoteConfigCondition, type RemoteConfigDeviceContext, type RemoteConfigEvaluatedParameter, type RemoteConfigEvaluationContext, type RemoteConfigFetchResponse, RemoteConfigInputError, type RemoteConfigParameter, type RemoteConfigParameterValue, type RemoteConfigPublishResult, type RemoteConfigRule, type RemoteConfigRuleType, type RemoteConfigSchema, type RemoteConfigTemplate, type RemoteConfigTemplateIssue, RemoteConfigValidationError, type RemoteConfigValueType, type RemoteConfigVersion, type RemoteConfigVersionDetail, type RemoteConfigVersionsPage, createRemoteConfigAdminApi, evaluateRemoteConfig, matchesRemoteConfigCondition, matchesRemoteConfigRule, remoteConfig, remoteConfigSchema, resolveRemoteConfigValues, validateRemoteConfigTemplate };