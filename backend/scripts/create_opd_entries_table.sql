-- =====================================================
-- OPD ENTRIES TABLE CREATION SCRIPT
-- =====================================================
-- This script creates the opd_entries table with all necessary fields
-- Run this in pgAdmin or psql

-- Drop table if exists (CAUTION: This will delete all OPD data!)
-- DROP TABLE IF EXISTS opd_entries CASCADE;

-- Create opd_entries table
CREATE TABLE IF NOT EXISTS opd_entries (
    opd_id SERIAL PRIMARY KEY,
    opd_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INTEGER NOT NULL,
    branch_id INTEGER NOT NULL,
    doctor_id INTEGER,
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    visit_time TIME DEFAULT CURRENT_TIME,
    visit_type VARCHAR(50) DEFAULT 'Walk-in' CHECK (visit_type IN ('Walk-in', 'Appointment', 'Emergency', 'Follow-up', 'Referral')),
    chief_complaint TEXT,
    symptoms TEXT,
    vital_signs JSONB,
    diagnosis TEXT,
    treatment_plan TEXT,
    prescriptions JSONB,
    lab_tests_ordered JSONB,
    imaging_ordered JSONB,
    procedures_performed TEXT,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    referral_to VARCHAR(200),
    referral_reason TEXT,
    consultation_fee DECIMAL(10, 2) DEFAULT 0.00,
    payment_status VARCHAR(20) DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Paid', 'Partially Paid', 'Waived')),
    payment_mode VARCHAR(50) CHECK (payment_mode IN ('Cash', 'Card', 'UPI', 'Insurance', 'Other')),
    status VARCHAR(20) DEFAULT 'Registered' CHECK (status IN ('Registered', 'Waiting', 'In-Consultation', 'Completed', 'Cancelled')),
    priority VARCHAR(20) DEFAULT 'Normal' CHECK (priority IN ('Normal', 'Urgent', 'Emergency')),
    queue_number INTEGER,
    waiting_time_minutes INTEGER,
    consultation_duration_minutes INTEGER,
    notes TEXT,
    allergies_noted TEXT,
    current_medications TEXT,
    medical_history_summary TEXT,
    is_follow_up BOOLEAN DEFAULT FALSE,
    previous_opd_id INTEGER,
    appointment_id INTEGER,
    insurance_claim_number VARCHAR(100),
    discharge_summary TEXT,
    discharge_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    
    -- Foreign key constraints
    CONSTRAINT fk_opd_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_opd_previous FOREIGN KEY (previous_opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_opd_number ON opd_entries(opd_number);
CREATE INDEX IF NOT EXISTS idx_opd_patient ON opd_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_branch ON opd_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_opd_doctor ON opd_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_visit_date ON opd_entries(visit_date);
CREATE INDEX IF NOT EXISTS idx_opd_status ON opd_entries(status);
CREATE INDEX IF NOT EXISTS idx_opd_payment_status ON opd_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_opd_visit_type ON opd_entries(visit_type);
CREATE INDEX IF NOT EXISTS idx_opd_created_at ON opd_entries(created_at);

-- Create trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_opd_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_opd_entries_updated_at ON opd_entries;
CREATE TRIGGER trigger_update_opd_entries_updated_at
    BEFORE UPDATE ON opd_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_opd_entries_updated_at();

-- Create function to generate OPD number
CREATE OR REPLACE FUNCTION generate_opd_number()
RETURNS TRIGGER AS $$
DECLARE
    new_opd_number VARCHAR(50);
    counter INTEGER;
BEGIN
    -- Generate OPD number format: OPD-YYYYMMDD-XXXX
    SELECT COUNT(*) + 1 INTO counter
    FROM opd_entries
    WHERE DATE(created_at) = CURRENT_DATE;
    
    new_opd_number := 'OPD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    NEW.opd_number := new_opd_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate OPD number if not provided
DROP TRIGGER IF EXISTS trigger_generate_opd_number ON opd_entries;
CREATE TRIGGER trigger_generate_opd_number
    BEFORE INSERT ON opd_entries
    FOR EACH ROW
    WHEN (NEW.opd_number IS NULL)
    EXECUTE FUNCTION generate_opd_number();

-- Add comments to table and columns
COMMENT ON TABLE opd_entries IS 'Stores outpatient department visit records';
COMMENT ON COLUMN opd_entries.opd_number IS 'Unique OPD visit number (auto-generated)';
COMMENT ON COLUMN opd_entries.visit_type IS 'Type of OPD visit (Walk-in, Appointment, Emergency, etc.)';
COMMENT ON COLUMN opd_entries.status IS 'Current status of the OPD visit';
COMMENT ON COLUMN opd_entries.vital_signs IS 'JSON object storing vital signs data';
COMMENT ON COLUMN opd_entries.prescriptions IS 'JSON array of prescribed medications';
COMMENT ON COLUMN opd_entries.lab_tests_ordered IS 'JSON array of lab tests ordered';

-- Success message
SELECT 'OPD Entries table created successfully!' AS message;
