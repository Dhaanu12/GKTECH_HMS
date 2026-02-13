-- Add referral source tracking columns to referral_doctor_module
ALTER TABLE referral_doctor_module 
ADD COLUMN IF NOT EXISTS referral_means VARCHAR(50),
ADD COLUMN IF NOT EXISTS means_id INTEGER;

-- Add referral source tracking columns to referral_patients
ALTER TABLE referral_patients 
ADD COLUMN IF NOT EXISTS referral_means VARCHAR(50),
ADD COLUMN IF NOT EXISTS means_id INTEGER;

-- Create indexes for performance on lookups
CREATE INDEX IF NOT EXISTS idx_rdm_referral_means ON referral_doctor_module(referral_means, means_id);
CREATE INDEX IF NOT EXISTS idx_rp_referral_means ON referral_patients(referral_means, means_id);
