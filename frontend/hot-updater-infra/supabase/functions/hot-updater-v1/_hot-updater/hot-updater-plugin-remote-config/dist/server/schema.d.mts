//#region src/server/schema.d.ts
/**
 * Remote Config's tables: the active template in one row, which a device's
 * fetch reads by key, and every published version beside it.
 */
declare const remoteConfigSchema: {
  /** One row, `id` `"active"`: the template devices receive and its version. */
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
  /** Each publish and rollback, kept so the Console can show and restore it. */
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
    /** `PUBLISH`, or `ROLLBACK` for a copy of `rollback_source`. */
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
};
type RemoteConfigSchema = typeof remoteConfigSchema;
//#endregion
export { RemoteConfigSchema, remoteConfigSchema };