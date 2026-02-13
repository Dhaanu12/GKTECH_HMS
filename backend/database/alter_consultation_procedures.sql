-- Add procedures column to consultation_outcomes and prescriptions tables
ALTER TABLE consultation_outcomes ADD COLUMN IF NOT EXISTS procedures TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS procedures TEXT;
