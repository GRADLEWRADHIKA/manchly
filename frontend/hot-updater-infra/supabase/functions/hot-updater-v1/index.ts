import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createHotUpdater } from "@hot-updater/server";
import { apiKeys, insights, remoteConfig } from "@hot-updater/server/plugins";
import { supabaseDatabase, supabaseStorage } from "@hot-updater/supabase/edge";
import { Hono } from "hono";
const functionName = "hot-updater-v1";
const bucketName = "hot-updater";
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const functionBasePath = `/${functionName}`;
const hotUpdaterBasePath = "/";
const hotUpdater = createHotUpdater({
	database: supabaseDatabase({
		supabaseUrl,
		supabaseServiceRoleKey
	}),
	plugins: [
		insights(),
		apiKeys(),
		remoteConfig()
	],
	storage: supabaseStorage({
		supabaseUrl,
		supabaseServiceRoleKey,
		bucketName
	})
});
const app = new Hono().basePath(functionBasePath);
app.get("/ping", (c) => c.text("pong"));
app.mount(hotUpdaterBasePath, hotUpdater.handlers.client);
Deno.serve(app.fetch);
