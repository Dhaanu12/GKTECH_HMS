-- Quick fix: Add service_date column to referral_payment_header
-- Run this in your PostgreSQL client or pgAdmin

-- Step 1: Add the column
ALTER TABLE referral_payment_header 
ADD COLUMN IF NOT EXISTS service_date DATE;

-- Step 2: Create index
CREATE INDEX IF NOT EXISTS idx_header_service_date 
ON referral_payment_header(service_date);

-- Step 3: Drop old unique constraint if it exists
DROP INDEX IF EXISTS idx_header_unique_ip_mci;

-- Step 4: Create new unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_header_unique_mapping 
ON referral_payment_header(medical_council_id, ip_number, service_date) 
WHERE medical_council_id IS NOT NULL 
AND ip_number IS NOT NULL 
AND service_date IS NOT NULL;

-- Step 5: Add comment
COMMENT ON COLUMN referral_payment_header.service_date 
IS 'Date when services were rendered to the patient';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'referral_payment_header' 
AND column_name = 'service_date';
