-- CreateTable
CREATE TABLE "telegram_subscriptions" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "buyer_telegram_id" TEXT NOT NULL,
    "buyer_username" TEXT,
    "invite_link" TEXT,
    "amount_inr" DOUBLE PRECISION NOT NULL,
    "payment_method" TEXT NOT NULL DEFAULT 'MOCK',
    "payment_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "telegram_subscriptions_channel_id_idx" ON "telegram_subscriptions"("channel_id");

-- CreateIndex
CREATE INDEX "telegram_subscriptions_buyer_telegram_id_idx" ON "telegram_subscriptions"("buyer_telegram_id");

-- CreateIndex
CREATE INDEX "telegram_subscriptions_status_idx" ON "telegram_subscriptions"("status");

-- AddForeignKey
ALTER TABLE "telegram_subscriptions" ADD CONSTRAINT "telegram_subscriptions_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "telegram_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;
