-- Make pan_number nullable to support bank account verifications
ALTER TABLE "kyc_verifications" 
ALTER COLUMN "pan_number" DROP NOT NULL;

