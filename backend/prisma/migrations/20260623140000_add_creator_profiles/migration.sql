-- CreatorCenter profile tables
DO $$ BEGIN
  CREATE TYPE "Niche" AS ENUM ('Finance', 'AI', 'Beauty', 'Fitness', 'SaaS');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "creator_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "bio" TEXT NOT NULL DEFAULT '',
  "niche" "Niche" NOT NULL,
  "city" TEXT NOT NULL DEFAULT '',
  "phone" TEXT NOT NULL DEFAULT '',
  "instagram" TEXT NOT NULL DEFAULT '',
  "sebi_registered" BOOLEAN NOT NULL DEFAULT false,
  "followers" TEXT NOT NULL DEFAULT '',
  "engagement_rate" TEXT NOT NULL DEFAULT '',
  "avg_views" TEXT NOT NULL DEFAULT '',
  "link_education" TEXT NOT NULL DEFAULT '',
  "link_collabs" TEXT NOT NULL DEFAULT '',
  "link_consulting" TEXT NOT NULL DEFAULT '',
  "link_ugc" TEXT NOT NULL DEFAULT '',
  "audience" JSONB NOT NULL DEFAULT '[]',
  "packages" JSONB NOT NULL DEFAULT '[]',
  "meta_permissions" JSONB,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_profiles_user_id_key" ON "creator_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "creator_profiles_niche_idx" ON "creator_profiles"("niche");
CREATE INDEX IF NOT EXISTS "creator_profiles_city_idx" ON "creator_profiles"("city");
CREATE INDEX IF NOT EXISTS "creator_profiles_is_published_idx" ON "creator_profiles"("is_published");

DO $$ BEGIN
  ALTER TABLE "creator_profiles"
    ADD CONSTRAINT "creator_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "profile_views" (
  "id" TEXT NOT NULL,
  "brand_user_id" TEXT NOT NULL,
  "creator_profile_id" TEXT NOT NULL,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "profile_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "profile_views_brand_user_id_creator_profile_id_key"
  ON "profile_views"("brand_user_id", "creator_profile_id");
CREATE INDEX IF NOT EXISTS "profile_views_brand_user_id_idx" ON "profile_views"("brand_user_id");
CREATE INDEX IF NOT EXISTS "profile_views_creator_profile_id_idx" ON "profile_views"("creator_profile_id");

DO $$ BEGIN
  ALTER TABLE "profile_views"
    ADD CONSTRAINT "profile_views_brand_user_id_fkey"
    FOREIGN KEY ("brand_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "profile_views"
    ADD CONSTRAINT "profile_views_creator_profile_id_fkey"
    FOREIGN KEY ("creator_profile_id") REFERENCES "creator_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- session_experts -> users FK (if not already present)
DO $$ BEGIN
  ALTER TABLE "session_experts"
    ADD CONSTRAINT "session_experts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
