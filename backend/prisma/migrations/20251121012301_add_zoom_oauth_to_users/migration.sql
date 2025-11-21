-- AlterTable
ALTER TABLE "users" ADD COLUMN     "zoom_access_token" TEXT,
ADD COLUMN     "zoom_account_id" TEXT,
ADD COLUMN     "zoom_connected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "zoom_connected_at" TIMESTAMP(3),
ADD COLUMN     "zoom_refresh_token" TEXT,
ADD COLUMN     "zoom_token_expires_at" TIMESTAMP(3);
