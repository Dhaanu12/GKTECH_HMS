-- =====================================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Creates Patients and OPD Entries Tables
-- =====================================================
-- Run this script in pgAdmin or psql to set up both tables

-- =====================================================
-- STEP 1: CREATE PATIENTS TABLE
-- =====================================================

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

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn_number);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact_number);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(first_name, last_name);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_registration_date ON patients(registration_date);

-- =====================================================
-- STEP 2: CREATE OPD ENTRIES TABLE
-- =====================================================

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
    
    CONSTRAINT fk_opd_patient FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE RESTRICT,
    CONSTRAINT fk_opd_previous FOREIGN KEY (previous_opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL
);

-- OPD entries table indexes
CREATE INDEX IF NOT EXISTS idx_opd_number ON opd_entries(opd_number);
CREATE INDEX IF NOT EXISTS idx_opd_patient ON opd_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_branch ON opd_entries(branch_id);
CREATE INDEX IF NOT EXISTS idx_opd_doctor ON opd_entries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_opd_visit_date ON opd_entries(visit_date);
CREATE INDEX IF NOT EXISTS idx_opd_status ON opd_entries(status);
CREATE INDEX IF NOT EXISTS idx_opd_payment_status ON opd_entries(payment_status);
CREATE INDEX IF NOT EXISTS idx_opd_visit_type ON opd_entries(visit_type);
CREATE INDEX IF NOT EXISTS idx_opd_created_at ON opd_entries(created_at);

-- =====================================================
-- STEP 3: CREATE TRIGGERS AND FUNCTIONS
-- =====================================================

-- Patients updated_at trigger
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

-- OPD entries updated_at trigger
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

-- OPD number auto-generation function
CREATE OR REPLACE FUNCTION generate_opd_number()
RETURNS TRIGGER AS $$
DECLARE
    new_opd_number VARCHAR(50);
    counter INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO counter
    FROM opd_entries
    WHERE DATE(created_at) = CURRENT_DATE;
    
    new_opd_number := 'OPD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    NEW.opd_number := new_opd_number;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_opd_number ON opd_entries;
CREATE TRIGGER trigger_generate_opd_number
    BEFORE INSERT ON opd_entries
    FOR EACH ROW
    WHEN (NEW.opd_number IS NULL)
    EXECUTE FUNCTION generate_opd_number();

-- =====================================================
-- STEP 4: ADD TABLE COMMENTS
-- =====================================================

COMMENT ON TABLE patients IS 'Stores patient demographic and medical information';
COMMENT ON COLUMN patients.mrn_number IS 'Medical Record Number - Unique identifier';
COMMENT ON COLUMN patients.status IS 'Current status (Active, Inactive, Deceased)';

COMMENT ON TABLE opd_entries IS 'Stores outpatient department visit records';
COMMENT ON COLUMN opd_entries.opd_number IS 'Unique OPD visit number (auto-generated)';
COMMENT ON COLUMN opd_entries.status IS 'Current status of the OPD visit';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

SELECT 
    'Database setup completed successfully!' AS message,
    (SELECT COUNT(*) FROM patients) AS total_patients,
    (SELECT COUNT(*) FROM opd_entries) AS total_opd_entries;
