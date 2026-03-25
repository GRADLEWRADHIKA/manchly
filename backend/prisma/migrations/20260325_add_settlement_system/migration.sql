-- CreateEnum
CREATE TYPE "SettlementStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'PARTIALLY_FAILED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REVERSED');

-- CreateTable
CREATE TABLE "creator_bank_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "ifsc_code" VARCHAR(11) NOT NULL,
    "beneficiary_name" TEXT NOT NULL,
    "bank_name" TEXT,
    "account_type" VARCHAR(20) DEFAULT 'savings',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "razorpay_fund_account_id" TEXT,
    "razorpay_contact_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creator_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlements" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "total_gross_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION NOT NULL,
    "gst_on_platform_fee" DOUBLE PRECISION NOT NULL,
    "tds_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "razorpay_fee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "status" "SettlementStatus" NOT NULL DEFAULT 'PENDING',
    "settlement_date" TIMESTAMP(3) NOT NULL,
    "processed_at" TIMESTAMP(3),
    "razorpay_payout_id" TEXT,
    "payout_status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "failure_reason" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "payout_details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settlement_items" (
    "id" TEXT NOT NULL,
    "settlement_id" TEXT NOT NULL,
    "transaction_type" VARCHAR(20) NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "course_id" TEXT,
    "webinar_id" TEXT,
    "gross_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION NOT NULL,
    "gst_on_platform_fee" DOUBLE PRECISION NOT NULL,
    "tds_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "settlement_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "creator_bank_accounts_user_id_key" ON "creator_bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_bank_accounts_razorpay_fund_account_id_key" ON "creator_bank_accounts"("razorpay_fund_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "creator_bank_accounts_razorpay_contact_id_key" ON "creator_bank_accounts"("razorpay_contact_id");

-- CreateIndex
CREATE INDEX "creator_bank_accounts_user_id_idx" ON "creator_bank_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlements_razorpay_payout_id_key" ON "settlements"("razorpay_payout_id");

-- CreateIndex
CREATE INDEX "settlements_creator_id_idx" ON "settlements"("creator_id");

-- CreateIndex
CREATE INDEX "settlements_status_idx" ON "settlements"("status");

-- CreateIndex
CREATE INDEX "settlements_settlement_date_idx" ON "settlements"("settlement_date");

-- CreateIndex
CREATE INDEX "settlements_payout_status_idx" ON "settlements"("payout_status");

-- CreateIndex
CREATE INDEX "settlement_items_settlement_id_idx" ON "settlement_items"("settlement_id");

-- CreateIndex
CREATE INDEX "settlement_items_transaction_id_idx" ON "settlement_items"("transaction_id");

-- CreateIndex
CREATE UNIQUE INDEX "settlement_items_transaction_type_transaction_id_key" ON "settlement_items"("transaction_type", "transaction_id");

-- AddForeignKey
ALTER TABLE "creator_bank_accounts" ADD CONSTRAINT "creator_bank_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "settlement_items" ADD CONSTRAINT "settlement_items_settlement_id_fkey" FOREIGN KEY ("settlement_id") REFERENCES "settlements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "WalletTxType" AS ENUM ('CREDIT', 'DEBIT');

-- CreateEnum
CREATE TYPE "WalletTxStatus" AS ENUM ('PENDING_SETTLEMENT', 'SETTLED', 'FAILED');

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "creator_id" TEXT NOT NULL,
    "type" "WalletTxType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "net_amount" DOUBLE PRECISION NOT NULL,
    "platform_fee" DOUBLE PRECISION NOT NULL,
    "gst_on_platform_fee" DOUBLE PRECISION NOT NULL,
    "tds_amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "WalletTxStatus" NOT NULL DEFAULT 'PENDING_SETTLEMENT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "transaction_type" VARCHAR(20) NOT NULL,
    "transaction_id" TEXT NOT NULL,
    "course_id" TEXT,
    "webinar_id" TEXT,
    "settlement_id" TEXT,
    "settlement_eta" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_transactions_creator_id_idx" ON "wallet_transactions"("creator_id");

-- CreateIndex
CREATE INDEX "wallet_transactions_status_idx" ON "wallet_transactions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_transactions_transaction_type_transaction_id_key" ON "wallet_transactions"("transaction_type", "transaction_id");

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
