-- Migration: Add type column to referral_hospitals table
-- Date: 2026-02-06
-- Description: Add type field to distinguish between Hospital and Department referrals

-- Add type column if it doesn't exist
ALTER TABLE referral_hospitals 
ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'Hospital';

-- Add comment for documentation
COMMENT ON COLUMN referral_hospitals.type IS 'Type of referral: Hospital or Department';

-- Update existing records to have 'Hospital' as default type if NULL
UPDATE referral_hospitals 
SET type = 'Hospital' 
WHERE type IS NULL;

-- Display success message
SELECT 'Type column added successfully to referral_hospitals table' AS status;
