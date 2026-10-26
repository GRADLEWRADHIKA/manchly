import { EngineDatabase, StorageAdapterWith } from "@hot-updater/plugin-core";
//#region src/supabaseConfig.d.ts
type SupabaseServiceRoleConfig = {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
};
//#endregion
//#region src/supabaseDatabase.d.ts
type SupabaseDatabaseConfig = SupabaseServiceRoleConfig;
/**
 * Hot Updater's database on Supabase: the storage engine through the shared
 * SQL core, fenced by the schema settings. Every read and write goes through
 * the service-role-only apply RPC, which runs no DDL, so Supabase migrations
 * create the tables.
 */
declare const supabaseDatabase: (config: SupabaseDatabaseConfig) => EngineDatabase;
//#endregion
//#region src/supabaseStorage.d.ts
type SupabaseStorageConfig = SupabaseServiceRoleConfig & {
  bucketName: string;
  /** Base path where bundles will be stored in the bucket. */
  basePath?: string;
  /** Signed download URL lifetime in seconds. @default 3600 */
  signedUrlExpiresIn?: number;
};
declare const supabaseStorage: (config: SupabaseStorageConfig) => StorageAdapterWith<"put" | "get" | "getDownloadUrl" | "exists" | "delete">;
//#endregion
export { supabaseDatabase as i, supabaseStorage as n, SupabaseDatabaseConfig as r, SupabaseStorageConfig as t };