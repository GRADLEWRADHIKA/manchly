-- CreateEnum
CREATE TYPE "CreatorTrialStatus" AS ENUM ('PENDING', 'AUTHORIZED', 'ACTIVE', 'CANCELLED', 'EXPIRED', 'FAILED');

-- CreateTable
CREATE TABLE "creator_trials" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" "CreatorTrialStatus" NOT NULL DEFAULT 'PENDING',
    "trial_days" INTEGER NOT NULL DEFAULT 3,
    "trial_price" DOUBLE PRECISION NOT NULL DEFAULT 199,
    "monthly_price" DOUBLE PRECISION NOT NULL DEFAULT 199,
    "auth_amount" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "cf_subscription_id" TEXT,
    "subscription_id" TEXT,
    "subscription_session_id" TEXT,
    "trial_starts_at" TIMESTAMP(3),
    "trial_ends_at" TIMESTAMP(3),
    "next_charge_at" TIMESTAMP(3),
    "cancelled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "creator_trials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_trials_cf_subscription_id_key" ON "creator_trials"("cf_subscription_id");
CREATE UNIQUE INDEX "creator_trials_subscription_id_key" ON "creator_trials"("subscription_id");
CREATE INDEX "creator_trials_user_id_idx" ON "creator_trials"("user_id");
CREATE INDEX "creator_trials_status_idx" ON "creator_trials"("status");

-- AddForeignKey
ALTER TABLE "creator_trials" ADD CONSTRAINT "creator_trials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
