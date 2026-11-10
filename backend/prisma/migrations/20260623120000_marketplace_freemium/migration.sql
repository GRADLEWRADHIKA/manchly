-- Premium expiry on users
ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "premium_expires_at" TIMESTAMP(3);

-- Unique profile view tracking per brand/agency user
CREATE TABLE IF NOT EXISTS "marketplace_profile_views" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "creator_id" TEXT NOT NULL,
  "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_profile_views_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_profile_views_user_id_creator_id_key"
  ON "marketplace_profile_views"("user_id", "creator_id");
CREATE INDEX IF NOT EXISTS "marketplace_profile_views_user_id_idx"
  ON "marketplace_profile_views"("user_id");
CREATE INDEX IF NOT EXISTS "marketplace_profile_views_creator_id_idx"
  ON "marketplace_profile_views"("creator_id");

DO $$ BEGIN
  ALTER TABLE "marketplace_profile_views"
    ADD CONSTRAINT "marketplace_profile_views_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_profile_views"
    ADD CONSTRAINT "marketplace_profile_views_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Marketplace creator card data
CREATE TABLE IF NOT EXISTS "marketplace_creator_profiles" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "niche" TEXT NOT NULL,
  "city" TEXT,
  "bio" TEXT,
  "instagram_handle" TEXT,
  "sebi_registered" BOOLEAN NOT NULL DEFAULT false,
  "followers_count" INTEGER NOT NULL DEFAULT 0,
  "engagement_rate" TEXT,
  "views_display" TEXT,
  "audience" JSONB NOT NULL DEFAULT '[]',
  "packages" JSONB NOT NULL DEFAULT '[]',
  "is_listed" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_creator_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_creator_profiles_user_id_key"
  ON "marketplace_creator_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "marketplace_creator_profiles_niche_idx"
  ON "marketplace_creator_profiles"("niche");
CREATE INDEX IF NOT EXISTS "marketplace_creator_profiles_city_idx"
  ON "marketplace_creator_profiles"("city");
CREATE INDEX IF NOT EXISTS "marketplace_creator_profiles_is_listed_idx"
  ON "marketplace_creator_profiles"("is_listed");

DO $$ BEGIN
  ALTER TABLE "marketplace_creator_profiles"
    ADD CONSTRAINT "marketplace_creator_profiles_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Premium subscription orders
DO $$ BEGIN
  CREATE TYPE "PremiumSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "premium_subscriptions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "plan" TEXT NOT NULL DEFAULT 'premium',
  "status" "PremiumSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "cashfree_order_id" TEXT,
  "cf_payment_id" TEXT,
  "expires_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "premium_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "premium_subscriptions_cashfree_order_id_key"
  ON "premium_subscriptions"("cashfree_order_id");
CREATE UNIQUE INDEX IF NOT EXISTS "premium_subscriptions_cf_payment_id_key"
  ON "premium_subscriptions"("cf_payment_id");
CREATE INDEX IF NOT EXISTS "premium_subscriptions_user_id_idx"
  ON "premium_subscriptions"("user_id");
CREATE INDEX IF NOT EXISTS "premium_subscriptions_status_idx"
  ON "premium_subscriptions"("status");

DO $$ BEGIN
  ALTER TABLE "premium_subscriptions"
    ADD CONSTRAINT "premium_subscriptions_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
