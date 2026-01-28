-- Migration to add 'Pediatric' to gender constraints
-- This migration updates the CHECK constraints on patients and appointments tables

BEGIN;

-- 1. Update patients table
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;
ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('Male', 'Female', 'Other', 'Pediatric'));

-- 2. Update appointments table
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_gender_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_gender_check CHECK (gender IN ('Male', 'Female', 'Other', 'Pediatric'));

COMMIT;
