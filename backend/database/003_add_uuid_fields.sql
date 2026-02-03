-- Migration 003: Add UUID fields

-- Enable pgcrypto for UUID generation if not available (Postgres 13+ has gen_random_uuid() built-in often, but pgcrypto covers older versions too)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Modules
ALTER TABLE modules ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE modules ADD CONSTRAINT modules_uuid_unique UNIQUE (uuid);

-- 2. Client Modules
ALTER TABLE client_modules ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE client_modules ADD CONSTRAINT client_modules_uuid_unique UNIQUE (uuid);

-- 3. Referral Doctor
ALTER TABLE referral_doctor ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE referral_doctor ADD CONSTRAINT referral_doctor_uuid_unique UNIQUE (uuid);

-- 4. Referral Doctor Service Percentage
ALTER TABLE referral_doctor_service_percentage ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid() NOT NULL;
ALTER TABLE referral_doctor_service_percentage ADD CONSTRAINT referral_doctor_service_percentage_uuid_unique UNIQUE (uuid);
