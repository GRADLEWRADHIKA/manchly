-- Ensure kyc_verified is NOT NULL with default value
-- First, set any NULL values to false
UPDATE "users" SET "kyc_verified" = false WHERE "kyc_verified" IS NULL;

-- Then alter the column to be NOT NULL with default
ALTER TABLE "users" 
ALTER COLUMN "kyc_verified" SET DEFAULT false,
ALTER COLUMN "kyc_verified" SET NOT NULL;

