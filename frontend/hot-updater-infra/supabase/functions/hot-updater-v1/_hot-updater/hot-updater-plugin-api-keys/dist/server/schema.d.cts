//#region src/server/schema.d.ts
/** v1's `api_keys` columns; the plaintext key is never stored, only its SHA-256 digest. */
declare const apiKeysSchema: {
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
};
type ApiKeysSchema = typeof apiKeysSchema;
//#endregion
export { ApiKeysSchema, apiKeysSchema };