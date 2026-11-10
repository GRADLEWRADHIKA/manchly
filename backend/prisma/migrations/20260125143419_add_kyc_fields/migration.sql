-- Create KYCStatus enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE "KYCStatus" AS ENUM ('PENDING', 'VERIFIED', 'FAILED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add KYC fields to users table
ALTER TABLE "users" 
ADD COLUMN IF NOT EXISTS "dob" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "pan_number" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "kyc_verified" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "kyc_status" VARCHAR(20),
ADD COLUMN IF NOT EXISTS "kyc_verified_at" TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS "kyc_verification_id" TEXT;

-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS "kyc_verifications" (
  "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "user_id" TEXT NOT NULL,
  "pan_number" VARCHAR(10) NOT NULL,
  "status" "KYCStatus" NOT NULL DEFAULT 'PENDING',
  "verification_type" VARCHAR(20) DEFAULT 'PAN',
  "pan_details" JSONB,
  "match_details" JSONB,
  "unique_request_id" VARCHAR(255),
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_verifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS "idx_kyc_user_id" ON "kyc_verifications"("user_id");
CREATE INDEX IF NOT EXISTS "idx_kyc_pan" ON "kyc_verifications"("pan_number");
CREATE INDEX IF NOT EXISTS "idx_kyc_status" ON "kyc_verifications"("status");

