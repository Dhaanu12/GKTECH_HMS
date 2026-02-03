-- Migration 002: Update Audit Fields and Timezone

-- 1. Update Audit Fields to VARCHAR
-- Create a function to relax the constraints first if dropping FKs is needed, 
-- but since we are changing type from INT to VARCHAR, existing data (INTs) casts fine to VARCHAR.
-- However, we must drop the Foreign Keys first because types must match exactly.

-- Drop FKs for modules
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_created_by_fkey;
ALTER TABLE modules DROP CONSTRAINT IF EXISTS modules_updated_by_fkey;
ALTER TABLE modules ALTER COLUMN created_by TYPE VARCHAR(100);
ALTER TABLE modules ALTER COLUMN updated_by TYPE VARCHAR(100);

-- Drop FKs for client_modules
ALTER TABLE client_modules DROP CONSTRAINT IF EXISTS client_modules_created_by_fkey;
ALTER TABLE client_modules DROP CONSTRAINT IF EXISTS client_modules_updated_by_fkey;
ALTER TABLE client_modules ALTER COLUMN created_by TYPE VARCHAR(100);
ALTER TABLE client_modules ALTER COLUMN updated_by TYPE VARCHAR(100);

-- Drop FKs for referral_doctor
ALTER TABLE referral_doctor DROP CONSTRAINT IF EXISTS referral_doctor_created_by_fkey;
ALTER TABLE referral_doctor DROP CONSTRAINT IF EXISTS referral_doctor_updated_by_fkey;
ALTER TABLE referral_doctor ALTER COLUMN created_by TYPE VARCHAR(100);
ALTER TABLE referral_doctor ALTER COLUMN updated_by TYPE VARCHAR(100);

-- Drop FKs for referral_doctor_service_percentage
ALTER TABLE referral_doctor_service_percentage DROP CONSTRAINT IF EXISTS referral_doctor_service_percentage_created_by_fkey;
ALTER TABLE referral_doctor_service_percentage DROP CONSTRAINT IF EXISTS referral_doctor_service_percentage_updated_by_fkey;
ALTER TABLE referral_doctor_service_percentage ALTER COLUMN created_by TYPE VARCHAR(100);
ALTER TABLE referral_doctor_service_percentage ALTER COLUMN updated_by TYPE VARCHAR(100);

-- 2. Timezone
-- We cannot easily change all existing columns if they are just TIMESTAMP.
-- However, we can set the database timezone or ensuring default uses AT TIME ZONE.
-- But the user said "All timestamp fields throughout database should be IST".
-- The most effective way for future inserts to be IST (if column is TIMESTAMP WITHOUT TIMEZONE) 
-- is to ensure the connection timezone is IST.
-- But we can try to force the default to be specific.

-- Example: ALTER TABLE modules ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata');
-- 'CURRENT_TIMESTAMP' gives TIMESTAMPTZ. Casting to 'Asia/Kolkata' gives TIMESTAMP (local time).

ALTER TABLE modules ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE modules ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE client_modules ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE client_modules ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

ALTER TABLE referral_doctor ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE referral_doctor ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE referral_doctor ALTER COLUMN geo_timestamp TYPE TIMESTAMP; -- Ensure it's timestamp

ALTER TABLE referral_doctor_service_percentage ALTER COLUMN created_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
ALTER TABLE referral_doctor_service_percentage ALTER COLUMN updated_at SET DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');

-- Note: The triggers update_updated_at_column should also be aware of timezone.
-- We might need to replace the function if it uses CURRENT_TIMESTAMP directly.
-- Standard 'update_updated_at_column' usually does NEW.updated_at = CURRENT_TIMESTAMP;
-- We should update the function or create a new one for these tables.

CREATE OR REPLACE FUNCTION update_updated_at_column_ist()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Re-bind triggers to new function
DROP TRIGGER IF EXISTS update_modules_updated_at ON modules;
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_ist();

DROP TRIGGER IF EXISTS update_client_modules_updated_at ON client_modules;
CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON client_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_ist();

DROP TRIGGER IF EXISTS update_referral_doctor_updated_at ON referral_doctor;
CREATE TRIGGER update_referral_doctor_updated_at BEFORE UPDATE ON referral_doctor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_ist();

DROP TRIGGER IF EXISTS update_referral_doctor_service_percentage_updated_at ON referral_doctor_service_percentage;
CREATE TRIGGER update_referral_doctor_service_percentage_updated_at BEFORE UPDATE ON referral_doctor_service_percentage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_ist();

