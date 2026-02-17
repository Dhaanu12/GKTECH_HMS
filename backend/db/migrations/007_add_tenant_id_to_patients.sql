-- Add tenant_id to referral_patients
ALTER TABLE referral_patients 
ADD COLUMN IF NOT EXISTS tenant_id INTEGER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_referral_patients_tenant ON referral_patients(tenant_id);
