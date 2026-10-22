import { ApiKeysSchema } from "./schema.mjs";
import { HotUpdaterDatabase } from "@hot-updater/plugin-core";
//#region src/server/model.d.ts
interface ApiKeyRow {
  readonly id: string;
  readonly hash: string;
  readonly name: string;
  readonly prefix: string;
  readonly role: "client";
  readonly created_at_ms: number;
  readonly revoked_at_ms: number | null;
}
/** The api-keys plugin's storage: key rows by id and by hash. */
interface ApiKeyModel {
  create(row: ApiKeyRow): Promise<"created" | "existing">;
  findByHash(hash: string): Promise<ApiKeyRow | null>;
  list(): Promise<readonly ApiKeyRow[]>;
  revoke(input: {
    readonly id: string;
    readonly revokedAtMs: number;
  }): Promise<ApiKeyRow | null>;
}
/** Today's `ApiKeyModel` on the engine: one unique read by hash, keyed writes. */
declare const createApiKeyModel: (db: HotUpdaterDatabase<ApiKeysSchema>) => ApiKeyModel;
//#endregion
export { ApiKeyModel, ApiKeyRow, createApiKeyModel };