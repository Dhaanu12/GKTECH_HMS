-- Create referral_agents table
CREATE TABLE IF NOT EXISTS referral_agents (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    mobile VARCHAR(20) NOT NULL,
    company VARCHAR(255),
    role VARCHAR(100),
    remarks TEXT,
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    tenant_id INTEGER,
    
    -- Bank Details
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    bank_account_number VARCHAR(100),
    bank_ifsc_code VARCHAR(50),
    
    -- Identity
    pan_card_number VARCHAR(255),
    pan_upload_path VARCHAR(500),
    
    -- Commissions
    referral_patient_commission NUMERIC(5,2) DEFAULT 0,
    referral_doc_commission NUMERIC(5,2) DEFAULT 0,
    
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_referral_agents_tenant ON referral_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_referral_agents_mobile ON referral_agents(mobile);
