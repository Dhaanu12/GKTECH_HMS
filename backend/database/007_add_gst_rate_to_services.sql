-- Add GST rate column to hospital_services table
ALTER TABLE hospital_services 
ADD COLUMN IF NOT EXISTS gst_rate NUMERIC(5,2) DEFAULT 0;

-- Update existing services with default GST rate (0% for medical services)
UPDATE hospital_services 
SET gst_rate = 0 
WHERE gst_rate IS NULL;

-- Add comment
COMMENT ON COLUMN hospital_services.gst_rate IS 'GST percentage rate for this service (0-100)';
