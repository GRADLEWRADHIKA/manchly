-- Course reels: short vertical promo videos that sell a course from a feed.

DO $$
BEGIN
  CREATE TYPE "ReelStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'HIDDEN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "course_reels" (
  "id"              TEXT NOT NULL,
  "course_id"       TEXT NOT NULL,
  "creator_id"      TEXT NOT NULL,
  "caption"         TEXT NOT NULL DEFAULT '',
  "mux_asset_id"    TEXT,
  "mux_upload_id"   TEXT,
  "mux_playback_id" TEXT,
  "upload_url"      TEXT,
  "playback_url"    TEXT,
  "thumbnail_url"   TEXT,
  "duration"        INTEGER,
  "status"          "ReelStatus" NOT NULL DEFAULT 'UPLOADING',
  "view_count"      INTEGER NOT NULL DEFAULT 0,
  "created_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "course_reels_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_reels_mux_asset_id_key"  ON "course_reels" ("mux_asset_id");
CREATE UNIQUE INDEX IF NOT EXISTS "course_reels_mux_upload_id_key" ON "course_reels" ("mux_upload_id");

-- The feed reads ready reels newest-first; the others support the creator views.
CREATE INDEX IF NOT EXISTS "course_reels_status_created_at_idx" ON "course_reels" ("status", "created_at");
CREATE INDEX IF NOT EXISTS "course_reels_course_id_idx"         ON "course_reels" ("course_id");
CREATE INDEX IF NOT EXISTS "course_reels_creator_id_idx"        ON "course_reels" ("creator_id");

DO $$
BEGIN
  ALTER TABLE "course_reels" ADD CONSTRAINT "course_reels_course_id_fkey"
    FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE "course_reels" ADD CONSTRAINT "course_reels_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
