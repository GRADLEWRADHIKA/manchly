-- Add KYC fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS dob VARCHAR(10),
ADD COLUMN IF NOT EXISTS pan_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS kyc_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS kyc_status VARCHAR(20),
ADD COLUMN IF NOT EXISTS kyc_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS kyc_verification_id UUID;

-- Create KYC verifications table
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pan_number VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  verification_type VARCHAR(20) DEFAULT 'PAN',
  pan_details JSONB,
  match_details JSONB,
  unique_request_id VARCHAR(255),
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_kyc_user_id ON kyc_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_pan ON kyc_verifications(pan_number);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_verifications(status);

