-- Add service_date field to referral_payment_header for better grouping
-- This enables mapping using doctor_id (medical_council_id), ip_number, and service_date

ALTER TABLE referral_payment_header 
  ADD COLUMN IF NOT EXISTS service_date DATE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_header_service_date ON referral_payment_header(service_date);

-- Drop old unique constraint if exists (based on ip_number and medical_council_id only)
DROP INDEX IF EXISTS idx_header_unique_ip_mci;

-- Create composite index for deduplication using medical_council_id, ip_number, and service_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_header_unique_mapping 
  ON referral_payment_header(medical_council_id, ip_number, service_date) 
  WHERE medical_council_id IS NOT NULL AND ip_number IS NOT NULL AND service_date IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN referral_payment_header.service_date IS 'Date when services were rendered to the patient';
