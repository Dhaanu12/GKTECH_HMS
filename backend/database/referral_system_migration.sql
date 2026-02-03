-- =============================================
-- REFERRAL SYSTEM MIGRATION
-- Run this manually after schema.sql
-- =============================================

-- 1. REFERRAL HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS referral_hospitals (
    referral_hospital_id SERIAL PRIMARY KEY,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    hospital_type VARCHAR(50) CHECK (hospital_type IN ('Government', 'Private', 'Specialty', 'Trust')),
    specialties TEXT[], -- Array of specialties offered
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. REFERRAL DOCTORS TABLE
CREATE TABLE IF NOT EXISTS referral_doctors (
    referral_doctor_id SERIAL PRIMARY KEY,
    referral_hospital_id INT NOT NULL REFERENCES referral_hospitals(referral_hospital_id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    phone_number VARCHAR(20),
    email VARCHAR(255),
    qualifications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. REFERRAL HOSPITAL MAPPING TABLE (Branch to Referral Hospital)
CREATE TABLE IF NOT EXISTS referral_hospital_mapping (
    mapping_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
    referral_hospital_id INT NOT NULL REFERENCES referral_hospitals(referral_hospital_id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT REFERENCES users(user_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, referral_hospital_id)
);

-- 4. ALTER CONSULTATIONS TABLE TO ADD REFERRAL SUPPORT
ALTER TABLE consultations 
ADD COLUMN IF NOT EXISTS referral_doctor_id INT REFERENCES referral_doctors(referral_doctor_id),
ADD COLUMN IF NOT EXISTS referral_notes TEXT;

-- 5. CREATE INDEXES FOR BETTER QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_referral_doctors_hospital ON referral_doctors(referral_hospital_id);
CREATE INDEX IF NOT EXISTS idx_referral_mapping_branch ON referral_hospital_mapping(branch_id);
CREATE INDEX IF NOT EXISTS idx_referral_mapping_hospital ON referral_hospital_mapping(referral_hospital_id);
CREATE INDEX IF NOT EXISTS idx_consultations_referral ON consultations(referral_doctor_id);

-- 6. CREATE TRIGGERS FOR AUTO-UPDATING updated_at
CREATE TRIGGER update_referral_hospitals_updated_at BEFORE UPDATE ON referral_hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_doctors_updated_at BEFORE UPDATE ON referral_doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
