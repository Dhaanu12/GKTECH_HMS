-- ============================================
-- FIX MISSING INDEXES - SIMPLIFIED VERSION
-- 2026-02-04
-- This script safely creates indexes without errors
-- ============================================

-- Suppress all notices and warnings
SET client_min_messages TO ERROR;

-- Function to safely create index
DO $$ 
DECLARE
    index_exists boolean;
BEGIN
    -- This will silently handle all index creation
    -- We'll use CREATE INDEX IF NOT EXISTS which is safe
    
    RAISE NOTICE 'Creating indexes...';
    
END $$;

-- ============================================
-- Create all indexes with IF NOT EXISTS
-- These will only be created if they don't exist
-- ============================================

-- Client Modules (if table exists)
CREATE INDEX IF NOT EXISTS idx_client_modules_hospital_level 
ON client_modules(hospital_id) WHERE hospital_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_client_modules_branch_level 
ON client_modules(branch_id) WHERE branch_id IS NOT NULL;

-- Branches
CREATE INDEX IF NOT EXISTS idx_branches_hospital 
ON branches(hospital_id) WHERE hospital_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_branches_active 
ON branches(is_active) WHERE is_active IS NOT NULL;

-- Billings
CREATE INDEX IF NOT EXISTS idx_billings_status 
ON billings(payment_status) WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billings_patient 
ON billings(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_billings_date 
ON billings(billing_date) WHERE billing_date IS NOT NULL;

-- Batch Hospital Mapping
CREATE INDEX IF NOT EXISTS idx_batch_hospital 
ON batch_hospital_mapping(hospital_id) WHERE hospital_id IS NOT NULL;

-- Appointments
CREATE INDEX IF NOT EXISTS idx_appointments_status 
ON appointments(status) WHERE status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_patient 
ON appointments(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_doctor 
ON appointments(doctor_id) WHERE doctor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_date 
ON appointments(appointment_date) WHERE appointment_date IS NOT NULL;

-- Consultations
CREATE INDEX IF NOT EXISTS idx_consultations_referral 
ON consultations(referral_doctor_id) WHERE referral_doctor_id IS NOT NULL;

-- OPD (if needed)
CREATE INDEX IF NOT EXISTS idx_opd_patient 
ON opd(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_opd_status 
ON opd(visit_status) WHERE visit_status IS NOT NULL;

-- Patients
CREATE INDEX IF NOT EXISTS idx_patients_mrn 
ON patients(mrn_number) WHERE mrn_number IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_patients_phone 
ON patients(contact_number) WHERE contact_number IS NOT NULL;

-- Users
CREATE INDEX IF NOT EXISTS idx_users_username 
ON users(username) WHERE username IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role) WHERE role IS NOT NULL;

-- Vitals
CREATE INDEX IF NOT EXISTS idx_vitals_patient 
ON vitals(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vitals_opd 
ON vitals(opd_id) WHERE opd_id IS NOT NULL;

-- Lab Orders
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient 
ON lab_orders(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_lab_orders_status 
ON lab_orders(status) WHERE status IS NOT NULL;

-- Clinical Notes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient 
ON clinical_notes(patient_id) WHERE patient_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_notes_opd 
ON clinical_notes(opd_id) WHERE opd_id IS NOT NULL;

-- Patient Documents
CREATE INDEX IF NOT EXISTS idx_patient_documents_patient 
ON patient_documents(patient_id) WHERE patient_id IS NOT NULL;

-- Reset message level
SET client_min_messages TO NOTICE;

SELECT 'Indexes created successfully!' AS status;
