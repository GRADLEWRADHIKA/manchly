-- Creator storefronts: <handle>.manchly.com

-- 1. Public handle on users. Nullable — only creators get one.
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "handle" TEXT;

-- Case-insensitive uniqueness: subdomains are case-insensitive, so "Abhishek"
-- and "abhishek" must not both exist. Handles are stored already lowercased;
-- the lower() index is belt-and-braces against a bad write path.
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_key" ON "users" ("handle");
CREATE UNIQUE INDEX IF NOT EXISTS "users_handle_lower_key" ON "users" (lower("handle"));

-- 2. Storefront profile.
CREATE TABLE IF NOT EXISTS "creator_storefronts" (
  "id"           TEXT NOT NULL,
  "user_id"      TEXT NOT NULL,
  "tagline"      TEXT NOT NULL DEFAULT '',
  "bio"          TEXT NOT NULL DEFAULT '',
  "cover_image"  TEXT,
  "accent_color" TEXT NOT NULL DEFAULT '#FFC107',
  "featured"     JSONB NOT NULL DEFAULT '[]',
  "website_url"  TEXT,
  "instagram"    TEXT,
  "linkedin"     TEXT,
  "youtube"      TEXT,
  "twitter"      TEXT,
  "is_published" BOOLEAN NOT NULL DEFAULT false,
  "view_count"   INTEGER NOT NULL DEFAULT 0,
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "creator_storefronts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "creator_storefronts_user_id_key"
  ON "creator_storefronts" ("user_id");
CREATE INDEX IF NOT EXISTS "creator_storefronts_is_published_idx"
  ON "creator_storefronts" ("is_published");

DO $$
BEGIN
  ALTER TABLE "creator_storefronts"
    ADD CONSTRAINT "creator_storefronts_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. Backfill a handle for every existing creator.
--    Slug from name (else the email local-part), stripped to [a-z0-9-], with a
--    numeric suffix on collision. Reserved words are skipped here by prefixing,
--    so no creator can land on "www", "api", etc.
DO $$
DECLARE
  r          RECORD;
  base       TEXT;
  candidate  TEXT;
  n          INTEGER;
  reserved   TEXT[] := ARRAY[
    'www','api','app','admin','server','mail','smtp','ftp','ns1','ns2','cdn',
    'static','assets','blog','help','support','docs','status','dev','staging',
    'test','manchly','about','pricing','login','signup','auth','dashboard',
    'creator','user','payments','webhook','sdk','store','shop'
  ];
BEGIN
  FOR r IN
    SELECT "id", "name", "email"
    FROM "users"
    WHERE "handle" IS NULL
      AND 'CREATOR' = ANY("user_type"::TEXT[])
    ORDER BY "created_at"
  LOOP
    base := lower(coalesce(nullif(trim(r."name"), ''), split_part(r."email", '@', 1)));
    base := regexp_replace(base, '[^a-z0-9]+', '-', 'g');   -- non-alphanumerics -> hyphen
    base := regexp_replace(base, '(^-+|-+$)', '', 'g');      -- trim hyphens
    base := regexp_replace(base, '-{2,}', '-', 'g');         -- collapse runs

    IF base IS NULL OR length(base) < 3 THEN
      base := 'creator';
    END IF;
    base := left(base, 30);

    IF base = ANY(reserved) THEN
      base := base || '-manchly';
    END IF;

    candidate := base;
    n := 1;
    WHILE EXISTS (SELECT 1 FROM "users" WHERE lower("handle") = candidate) LOOP
      n := n + 1;
      candidate := base || n::TEXT;
    END LOOP;

    UPDATE "users" SET "handle" = candidate WHERE "id" = r."id";
  END LOOP;
END $$;

-- 4. Give every backfilled creator an unpublished storefront row so the
--    dashboard has something to edit. They stay dark until published.
INSERT INTO "creator_storefronts" ("id", "user_id")
SELECT gen_random_uuid()::TEXT, u."id"
FROM "users" u
WHERE u."handle" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "creator_storefronts" s WHERE s."user_id" = u."id");
