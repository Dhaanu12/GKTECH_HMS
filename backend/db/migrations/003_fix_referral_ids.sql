-- Fix UUID vs Integer mismatch for Referral Payment Tables

DROP TABLE IF EXISTS referral_payment_details CASCADE;
DROP TABLE IF EXISTS referral_payment_header CASCADE;
DROP TABLE IF EXISTS referral_payment_upload_batch CASCADE;

-- 1. Batch Table (File Upload Metadata)
CREATE TABLE referral_payment_upload_batch (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    hospital_id INTEGER NOT NULL, -- Changed from UUID to INTEGER
    branch_id INTEGER,            -- Changed from UUID to INTEGER
    file_name VARCHAR(255) NOT NULL,
    total_records INTEGER DEFAULT 0,
    total_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Standard Audit Fields
    status VARCHAR(50) DEFAULT 'Active',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- 2. Header Table (Patient Transaction / Common Fields)
CREATE TABLE referral_payment_header (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    batch_id INTEGER REFERENCES referral_payment_upload_batch(id) ON DELETE CASCADE,
    
    patient_name VARCHAR(150),
    admission_type VARCHAR(100),
    department VARCHAR(100),
    doctor_name VARCHAR(150),
    medical_council_id VARCHAR(100),
    payment_mode VARCHAR(50),
    
    total_referral_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    -- Standard Audit Fields
    status VARCHAR(50) DEFAULT 'Active',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- 3. Details Table (Service Breakdown)
CREATE TABLE referral_payment_details (
    id SERIAL PRIMARY KEY,
    uuid VARCHAR(50) UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    payment_header_id INTEGER REFERENCES referral_payment_header(id) ON DELETE CASCADE,
    
    service_name VARCHAR(150),
    service_cost DECIMAL(15, 2) DEFAULT 0.00,
    referral_percentage DECIMAL(5, 2) DEFAULT 0.00,
    referral_amount DECIMAL(15, 2) DEFAULT 0.00,
    
    remarks TEXT,
    
    -- Standard Audit Fields
    status VARCHAR(50) DEFAULT 'Active',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata')
);

-- Create indexes for performance
CREATE INDEX idx_batch_hospital ON referral_payment_upload_batch(hospital_id);
CREATE INDEX idx_header_batch ON referral_payment_header(batch_id);
CREATE INDEX idx_details_header ON referral_payment_details(payment_header_id);
