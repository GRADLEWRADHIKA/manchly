-- Cashfree Migration: Replace Razorpay with Cashfree
-- Run this manually against your database

-- Step 1: Add CASHFREE to PaymentMethod enum
ALTER TYPE "PaymentMethod" ADD VALUE IF NOT EXISTS 'CASHFREE';

-- Step 2: Rename columns in transactions table
ALTER TABLE "transactions" RENAME COLUMN "razorpay_order_id" TO "cashfree_order_id";
ALTER TABLE "transactions" RENAME COLUMN "razorpay_payment_id" TO "cf_payment_id";
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "razorpay_signature";

-- Step 3: Rename columns in webinar_transactions table
ALTER TABLE "webinar_transactions" RENAME COLUMN "razorpay_order_id" TO "cashfree_order_id";
ALTER TABLE "webinar_transactions" RENAME COLUMN "razorpay_payment_id" TO "cf_payment_id";
ALTER TABLE "webinar_transactions" DROP COLUMN IF EXISTS "razorpay_signature";

-- Step 4: Rename columns in creator_bank_accounts table
ALTER TABLE "creator_bank_accounts" RENAME COLUMN "razorpay_fund_account_id" TO "cashfree_beneficiary_id";
ALTER TABLE "creator_bank_accounts" DROP COLUMN IF EXISTS "razorpay_contact_id";

-- Step 5: Rename columns in settlements table
ALTER TABLE "settlements" RENAME COLUMN "razorpay_payout_id" TO "cashfree_transfer_id";
ALTER TABLE "settlements" DROP COLUMN IF EXISTS "razorpay_fee";

-- Step 6: Update default payment method for new records
ALTER TABLE "transactions" ALTER COLUMN "payment_method" SET DEFAULT 'CASHFREE'::"PaymentMethod";
ALTER TABLE "webinar_transactions" ALTER COLUMN "payment_method" SET DEFAULT 'CASHFREE'::"PaymentMethod";
