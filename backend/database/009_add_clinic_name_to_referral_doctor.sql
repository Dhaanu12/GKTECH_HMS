-- Add clinic_name to referral_doctor table
ALTER TABLE referral_doctor
ADD COLUMN IF NOT EXISTS clinic_name VARCHAR(255);
