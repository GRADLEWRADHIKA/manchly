import { ApiKeyRow } from "./model.cjs";
//#region src/server/apiKeys.d.ts
declare const API_KEY_HEADER_NAME = "x-api-key";
type ApiKeyMetadata = Omit<ApiKeyRow, "hash">;
interface CreatedApiKey {
  /** Plaintext credential. It cannot be recovered after this call returns. */
  readonly apiKey: string;
  /** Non-secret metadata. The persisted SHA-256 hash is never exposed. */
  readonly record: ApiKeyMetadata;
}
interface ApiKeyManagementAPI {
  /** Creates an API key and returns its plaintext exactly once. */
  create(input: {
    readonly name: string;
  }): Promise<{
    readonly apiKey: string;
    readonly record: ApiKeyMetadata;
  }>;
  /** Lists non-secret API key metadata, including revoked keys. */
  list(): Promise<readonly ApiKeyMetadata[]>;
  /** Revokes an API key immediately and returns only non-secret metadata. */
  revoke(input: {
    readonly id: string;
  }): Promise<ApiKeyMetadata | null>;
}
//#endregion
export { API_KEY_HEADER_NAME, ApiKeyManagementAPI, ApiKeyMetadata, CreatedApiKey };