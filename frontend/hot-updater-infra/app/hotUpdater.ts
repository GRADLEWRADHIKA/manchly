import { createHotUpdater } from "@hot-updater/server";
import { apiKeys, insights, remoteConfig } from "@hot-updater/server/plugins";
import { supabaseDatabase, supabaseStorage } from "@hot-updater/supabase";

/**
 * The deployed server's database, storage, and plugins, on which
 * provision-client-credential.mjs registers the app's client credential.
 * It stays in the scaffold: the app's hot-updater.config.ts lists the same
 * database, storage, and plugins.
 */
export const hotUpdater = createHotUpdater({
  database: supabaseDatabase({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.HOT_UPDATER_SUPABASE_SERVICE_ROLE_KEY!,
  }),
  storage: supabaseStorage({
    supabaseUrl: process.env.HOT_UPDATER_SUPABASE_URL!,
    supabaseServiceRoleKey: process.env.HOT_UPDATER_SUPABASE_SERVICE_ROLE_KEY!,
    bucketName: process.env.HOT_UPDATER_SUPABASE_BUCKET_NAME!,
  }),
  plugins: [apiKeys(), insights(), remoteConfig()],
});
