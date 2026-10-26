import { AggregateDefinition, TableDefinition } from "../../serverPlugin/schema.cjs";
import "../../index.cjs";
//#region src/engine/core/schema.d.ts
declare const coreSchema: {
  readonly bundles: TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly git_commit_hash: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly required: false;
    };
    readonly metadata: {
      readonly type: "json";
    };
    readonly manifest_storage_uri: {
      readonly type: "string";
    };
    readonly manifest_file_hash: {
      readonly type: "string";
    };
    readonly asset_base_storage_uri: {
      readonly type: "string";
    };
  }, {}, {
    readonly byPlatform: {
      readonly eq: readonly ["platform"];
      readonly sort: readonly ["id"];
    };
    readonly all: {
      readonly eq: readonly [];
      readonly sort: readonly ["id"];
    };
  }, readonly ["id"]>;
  readonly bundle_patches: TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 255;
    };
    readonly bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly references: {
        readonly model: "bundles";
        readonly onDelete: "cascade";
      };
    };
    readonly base_bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly references: {
        readonly model: "bundles";
        readonly onDelete: "cascade";
      };
    };
    readonly base_file_hash: {
      readonly type: "string";
    };
    readonly patch_file_hash: {
      readonly type: "string";
    };
    readonly patch_storage_uri: {
      readonly type: "string";
    };
    readonly byte_size: {
      readonly type: "integer";
    };
    readonly order_index: {
      readonly type: "integer";
    };
  }, {}, {
    readonly pair: {
      readonly eq: readonly ["bundle_id", "base_bundle_id"];
      readonly sort: readonly [];
      readonly unique: true;
    };
    readonly byBundle: {
      readonly eq: readonly ["bundle_id"];
      readonly sort: readonly ["order_index"];
      readonly root: {
        readonly model: "bundles";
      };
    };
    readonly byBase: {
      readonly eq: readonly ["base_bundle_id"];
      readonly sort: readonly ["bundle_id"];
    };
  }, readonly ["id"]>;
  readonly releases: TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 36;
    };
    readonly revision: {
      readonly type: "integer";
    };
    readonly scope_key: {
      readonly type: "string";
      readonly maxLength: 2048;
      readonly ascii: true;
    };
    readonly channel_id: {
      readonly references: {
        readonly model: "channels";
        readonly onDelete: "restrict";
      };
      readonly type: "string";
      readonly maxLength: 1408;
      readonly ascii: true;
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly kind: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly bundle_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
      readonly references: {
        readonly model: "bundles";
        readonly onDelete: "restrict";
      };
    };
    readonly strategy: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly target_app_version: {
      readonly type: "string";
      readonly required: false;
    };
    readonly fingerprint_hash: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly required: false;
    };
    readonly enabled: {
      readonly type: "boolean";
    };
    readonly should_force_update: {
      readonly type: "boolean";
    };
    readonly message: {
      readonly type: "string";
      readonly required: false;
    };
    readonly rollout_cohort_count: {
      readonly type: "integer";
    };
    readonly target_cohorts: {
      readonly type: "json";
    };
    readonly operation: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly source_release_id: {
      readonly type: "string";
      readonly maxLength: 36;
      readonly required: false;
      readonly references: {
        readonly model: "releases";
        readonly onDelete: "none";
      };
    };
    readonly created_at_ms: {
      readonly type: "integer";
    };
    readonly updated_at_ms: {
      readonly type: "integer";
    };
  }, {}, {
    readonly byScope: {
      readonly eq: readonly ["scope_key"];
      readonly sort: readonly ["id"];
      readonly root: {
        readonly model: "release_catalogs";
      };
    };
    readonly byScopeEnabled: {
      readonly eq: readonly ["scope_key", "enabled"];
      readonly sort: readonly ["id"];
      readonly root: {
        readonly model: "release_catalogs";
      };
    };
    readonly byChannelPlatform: {
      readonly eq: readonly ["channel_id", "platform"];
      readonly sort: readonly ["id"];
    };
    readonly byChannelPlatformEnabled: {
      readonly eq: readonly ["channel_id", "platform", "enabled"];
      readonly sort: readonly ["id"];
    };
    readonly byBundle: {
      readonly eq: readonly ["bundle_id"];
      readonly sort: readonly ["id"];
    };
    readonly all: {
      readonly eq: readonly [];
      readonly sort: readonly ["id"];
    };
  }, readonly ["id"]>;
  readonly release_catalogs: TableDefinition<{
    readonly scope_key: {
      readonly type: "string";
      readonly maxLength: 2048;
      readonly ascii: true;
    };
    readonly catalog_id: {
      readonly type: "string";
      readonly maxLength: 255;
    };
    readonly strategy: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly channel_id: {
      readonly references: {
        readonly model: "channels";
        readonly onDelete: "none";
      };
      readonly type: "string";
      readonly maxLength: 1408;
      readonly ascii: true;
    };
    readonly channel_key: {
      readonly type: "string";
      readonly maxLength: 1400;
      readonly ascii: true;
    };
    readonly platform: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly fingerprint_hash: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly required: false;
    };
    readonly generation: {
      readonly type: "integer";
    };
    readonly payload: {
      readonly type: "string";
    };
    readonly catalog_hash: {
      readonly type: "string";
      readonly maxLength: 71;
    };
    readonly byte_size: {
      readonly type: "integer";
    };
    readonly is_tombstone: {
      readonly type: "boolean";
    };
    readonly updated_at_ms: {
      readonly type: "integer";
    };
  }, {}, {
    readonly all: {
      readonly eq: readonly [];
      readonly sort: readonly ["scope_key"];
    };
  }, readonly ["scope_key"]>;
  readonly channels: TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 1408;
      readonly ascii: true;
    };
    readonly name: {
      readonly type: "string";
      readonly maxLength: 255;
      readonly unique: true;
    };
  }, {}, {
    readonly all: {
      readonly eq: readonly [];
      readonly sort: readonly ["name"];
    };
  }, readonly ["id"]>;
  readonly bundle_totals: AggregateDefinition<{
    readonly platform_key: {
      readonly type: "string";
      readonly maxLength: 16;
    };
  }, "bundles", {
    readonly byPlatform: {
      readonly eq: readonly ["platform_key"];
      readonly sort: readonly [];
    };
  }, never, readonly ["platform_key"]>;
};
/**
 * Core's tables as the engine types them: the type of `createEngine`'s
 * `core` handle, which the server's core API is written against. A change to
 * it is a change to core's schema, which ships with a migration.
 */
type CoreSchema = typeof coreSchema;
//#endregion
export { CoreSchema, coreSchema };