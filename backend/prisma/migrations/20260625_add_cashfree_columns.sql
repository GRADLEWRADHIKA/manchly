-- Migration: add_cashfree_columns
-- Adds cashfree_order_id and cashfree_beneficiary_id if they don't already exist.
-- Run this manually against your database if prisma migrate dev fails due to cross-schema
-- constraints (common on Supabase with auth.users foreign keys).

ALTER TABLE "transactions"
  ADD COLUMN IF NOT EXISTS "cashfree_order_id" TEXT;

ALTER TABLE "creator_bank_accounts"
  ADD COLUMN IF NOT EXISTS "cashfree_beneficiary_id" TEXT;

-- Ensure uniqueness constraints match the Prisma schema
-- (safe to run even if indexes already exist)
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_cashfree_order_id_key"
  ON "transactions"("cashfree_order_id");

CREATE UNIQUE INDEX IF NOT EXISTS "creator_bank_accounts_cashfree_beneficiary_id_key"
  ON "creator_bank_accounts"("cashfree_beneficiary_id");
