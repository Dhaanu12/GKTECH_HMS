-- Migration: Create referral diagnostics table
-- Date: 2026-02-06
-- Description: Create separate table for referral diagnostics centers

-- Create referral_diagnostics table
CREATE TABLE IF NOT EXISTS referral_diagnostics (
    referral_diagnostic_id SERIAL PRIMARY KEY,
    diagnostic_name VARCHAR(255) NOT NULL,
    diagnostic_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    diagnostic_type VARCHAR(50) CHECK (diagnostic_type IN ('Government', 'Private', 'Specialty', 'Trust')),
    services TEXT[], -- Array of services offered (e.g., X-Ray, MRI, CT Scan, Blood Tests)
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referral_diagnostics_city ON referral_diagnostics(city);
CREATE INDEX IF NOT EXISTS idx_referral_diagnostics_active ON referral_diagnostics(is_active);

-- Add comments
COMMENT ON TABLE referral_diagnostics IS 'Stores referral diagnostic centers information';
COMMENT ON COLUMN referral_diagnostics.diagnostic_name IS 'Name of the diagnostic center';
COMMENT ON COLUMN referral_diagnostics.services IS 'Array of services offered by the diagnostic center';

-- Create referral_diagnostic_mapping table
CREATE TABLE IF NOT EXISTS referral_diagnostic_mapping (
    mapping_id SERIAL PRIMARY KEY,
    branch_id INT REFERENCES branches(branch_id) ON DELETE CASCADE,
    referral_diagnostic_id INT REFERENCES referral_diagnostics(referral_diagnostic_id) ON DELETE CASCADE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, referral_diagnostic_id)
);

-- Add index for mapping table
CREATE INDEX IF NOT EXISTS idx_diagnostic_mapping_branch ON referral_diagnostic_mapping(branch_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_mapping_diagnostic ON referral_diagnostic_mapping(referral_diagnostic_id);

COMMENT ON TABLE referral_diagnostic_mapping IS 'Maps referral diagnostics to branches';

-- Display success message
SELECT 'Referral diagnostics table and mapping created successfully' AS status;
