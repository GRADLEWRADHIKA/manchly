-- Feature #2 (per-role device limit): scope each account's device sessions by
-- user_type, so the Creator and User roles each get an INDEPENDENT device cap.
-- A single account can therefore be signed in as Creator on one device and as
-- User on another at the same time; two devices for the SAME role is what gets
-- capped. Existing rows default to the USER role.

ALTER TABLE "user_devices" ADD COLUMN "user_type" TEXT NOT NULL DEFAULT 'USER';

-- Swap the account-wide unique (user_id, device_id) for a per-role unique.
DROP INDEX IF EXISTS "user_devices_user_id_device_id_key";
CREATE UNIQUE INDEX "user_devices_user_id_user_type_device_id_key"
  ON "user_devices"("user_id", "user_type", "device_id");

-- Swap the (user_id) index for (user_id, user_type).
DROP INDEX IF EXISTS "user_devices_user_id_idx";
CREATE INDEX "user_devices_user_id_user_type_idx"
  ON "user_devices"("user_id", "user_type");
