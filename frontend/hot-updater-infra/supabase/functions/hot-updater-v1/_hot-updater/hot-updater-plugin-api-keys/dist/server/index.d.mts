import { ApiKeysSchema, apiKeysSchema } from "./schema.mjs";
import { ApiKeyModel, ApiKeyRow, createApiKeyModel } from "./model.mjs";
import { API_KEY_HEADER_NAME, ApiKeyManagementAPI, ApiKeyMetadata, CreatedApiKey } from "./apiKeys.mjs";
//#region src/server/index.d.ts
interface ApiKeysOptions {
  /** The request header that carries the key; defaults to `x-api-key`. */
  readonly headerName?: string;
}
/**
 * API keys: protects client routes with keys whose SHA-256 digests
 * are stored, and manages them in-process.
 */
declare const apiKeys: (options?: ApiKeysOptions) => import("@hot-updater/plugin-core").HotUpdaterPlugin<"apiKeys", {
  readonly api_keys: import("@hot-updater/plugin-core").TableDefinition<{
    readonly id: {
      readonly type: "string";
      readonly maxLength: 255;
    };
    readonly hash: {
      readonly type: "string";
      readonly maxLength: 64;
      readonly unique: true;
    };
    readonly name: {
      readonly type: "string";
      readonly maxLength: 64;
    };
    readonly prefix: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly role: {
      readonly type: "string";
      readonly maxLength: 16;
    };
    readonly created_at_ms: {
      readonly type: "integer";
    };
    readonly revoked_at_ms: {
      readonly type: "integer";
      readonly required: false;
    };
  }, {}, {
    readonly byCreated: {
      readonly eq: readonly [];
      readonly sort: readonly ["created_at_ms"];
    };
  }, readonly ["id"]>;
}, {
  api: {
    /** Registers a known plaintext key idempotently, for managed init. */
    register: (input: {
      readonly apiKey: string;
      readonly name: string;
      readonly createdAtMs?: number;
    }) => Promise<CreatedApiKey>;
    /** Reuses a saved key or creates one, for managed init. */
    provision: (input: {
      readonly existingApiKey?: string;
      readonly name: string;
    }) => Promise<CreatedApiKey>;
    create(input: {
      readonly name: string;
    }): Promise<{
      readonly apiKey: string;
      readonly record: ApiKeyMetadata;
    }>;
    list(): Promise<readonly ApiKeyMetadata[]>;
    revoke(input: {
      readonly id: string;
    }): Promise<ApiKeyMetadata | null>;
  };
  clientAuth: {
    varyHeaders: string[];
    authenticate: (headers: Headers) => Promise<boolean>;
  };
}, {
  readonly clientAuth: true;
}>;
//#endregion
export { API_KEY_HEADER_NAME, type ApiKeyManagementAPI, type ApiKeyMetadata, type ApiKeyModel, type ApiKeyRow, ApiKeysOptions, type ApiKeysSchema, type CreatedApiKey, apiKeys, apiKeysSchema, createApiKeyModel };