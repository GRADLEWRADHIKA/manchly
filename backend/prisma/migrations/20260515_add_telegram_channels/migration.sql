-- CreateTable
CREATE TABLE "telegram_channels" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "channel_title" TEXT NOT NULL,
    "creator_telegram_id" TEXT NOT NULL,
    "creator_username" TEXT,
    "price_inr" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "telegram_channels_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "telegram_channels_channel_id_key" ON "telegram_channels"("channel_id");

-- CreateIndex
CREATE INDEX "telegram_channels_creator_telegram_id_idx" ON "telegram_channels"("creator_telegram_id");

-- CreateIndex
CREATE INDEX "telegram_channels_status_idx" ON "telegram_channels"("status");
