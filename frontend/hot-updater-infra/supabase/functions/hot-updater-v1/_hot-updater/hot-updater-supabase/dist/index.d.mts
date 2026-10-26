import { n as supabaseStorage, r as SupabaseDatabaseConfig, t as SupabaseStorageConfig } from "./supabaseStorage-BryXQ72m.mjs";
import { ToolingDatabase } from "@hot-updater/plugin-core";
//#region src/supabaseMigration.d.ts
/**
 * Hot Updater's database on Supabase, with the migration `hot-updater db
 * generate` writes to `supabase/migrations`: core's tables, the server's
 * plugin tables, the apply RPC that may name them, and their settings rows.
 * `supabase db push` applies it.
 */
declare const supabaseDatabase: (config: SupabaseDatabaseConfig) => ToolingDatabase;
//#endregion
export { type SupabaseDatabaseConfig, SupabaseStorageConfig, supabaseDatabase, supabaseStorage };