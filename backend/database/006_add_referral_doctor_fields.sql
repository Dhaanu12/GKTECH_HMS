-- Migration: Add detailed address and clinic photo to referral_doctor
ALTER TABLE referral_doctor
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS clinic_photo_path VARCHAR(255);
