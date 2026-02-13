-- =====================================================
-- PATIENTS TABLE CREATION SCRIPT
-- =====================================================
-- This script creates the patients table with all necessary fields
-- Run this in pgAdmin or psql

-- Drop table if exists (CAUTION: This will delete all patient data!)
-- DROP TABLE IF EXISTS patients CASCADE;

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    mrn_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    date_of_birth DATE,
    age INTEGER,
    gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other')),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    blood_group VARCHAR(10),
    allergies TEXT,
    chronic_conditions TEXT,
    current_medications TEXT,
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    insurance_expiry_date DATE,
    photo_url TEXT,
    id_proof_type VARCHAR(50),
    id_proof_number VARCHAR(100),
    occupation VARCHAR(100),
    marital_status VARCHAR(20) CHECK (marital_status IN ('Single', 'Married', 'Divorced', 'Widowed', 'Other')),
    nationality VARCHAR(50) DEFAULT 'Indian',
    language_preference VARCHAR(50),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_visit_date TIMESTAMP,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Deceased')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn_number);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_registration_date ON patients(registration_date);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_patients_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_patients_updated_at ON patients;
CREATE TRIGGER trigger_update_patients_updated_at
    BEFORE UPDATE ON patients
    FOR EACH ROW
    EXECUTE FUNCTION update_patients_updated_at();

-- Add comments to table and columns
COMMENT ON TABLE patients IS 'Stores patient demographic and medical information';
COMMENT ON COLUMN patients.mrn_number IS 'Medical Record Number - Unique identifier for each patient';
COMMENT ON COLUMN patients.status IS 'Current status of patient record (Active, Inactive, Deceased)';
COMMENT ON COLUMN patients.allergies IS 'Known allergies of the patient';
COMMENT ON COLUMN patients.chronic_conditions IS 'Long-term medical conditions';

-- Success message
SELECT 'Patients table created successfully!' AS message;
