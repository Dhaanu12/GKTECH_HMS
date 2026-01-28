-- =============================================
-- HOSPITAL MANAGEMENT SYSTEM - POSTGRESQL SCHEMA
-- =============================================

-- Drop existing database if needed (uncomment to use)
-- DROP DATABASE IF EXISTS hms_database;

-- Create database (run this separately or ensure DB exists)
-- CREATE DATABASE hms_database;

-- Connect to the database
-- \c hms_database;

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(100) NOT NULL,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. HOSPITALS TABLE
CREATE TABLE IF NOT EXISTS hospitals (
    hospital_id SERIAL PRIMARY KEY,
    hospital_name VARCHAR(200) NOT NULL,
    hospital_code VARCHAR(50) UNIQUE NOT NULL,
    headquarters_address TEXT,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    established_date DATE,
    total_beds INT,
    hospital_type VARCHAR(20) CHECK (hospital_type IN ('Government', 'Private', 'Trust', 'Corporate')) DEFAULT 'Private',
    accreditation VARCHAR(100),
    website VARCHAR(200),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    password_hash VARCHAR(255) NOT NULL,
    role_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    password_changed_at TIMESTAMP NULL,
    must_change_password BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(role_id) ON DELETE RESTRICT
);

-- 4. BRANCHES TABLE
CREATE TABLE IF NOT EXISTS branches (
    branch_id SERIAL PRIMARY KEY,
    hospital_id INT NOT NULL,
    branch_name VARCHAR(200) NOT NULL,
    branch_code VARCHAR(50) NOT NULL,
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    branch_manager VARCHAR(100),
    total_beds INT,
    emergency_available BOOLEAN DEFAULT FALSE,
    icu_beds INT DEFAULT 0,
    general_beds INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    UNIQUE (hospital_id, branch_code)
);

-- 5. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_name VARCHAR(100) NOT NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. BRANCH_DEPARTMENTS TABLE (Mapping)
CREATE TABLE IF NOT EXISTS branch_departments (
    hospital_dept_id SERIAL PRIMARY KEY,
    branch_id INT NOT NULL,
    department_id INT NOT NULL,
    floor_number VARCHAR(10),
    room_numbers VARCHAR(255),
    head_of_department VARCHAR(100),
    is_operational BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (branch_id, department_id)
);

-- 7. STAFF TABLE
CREATE TABLE IF NOT EXISTS staff (
    staff_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    staff_code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    qualification VARCHAR(255),
    staff_type VARCHAR(100),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    aadhar_number VARCHAR(12),
    profile_photo VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 8. DOCTORS TABLE
CREATE TABLE IF NOT EXISTS doctors (
    doctor_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    doctor_code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    experience_years INT,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_council VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    consultation_fee DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT TRUE,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 9. NURSES TABLE
CREATE TABLE IF NOT EXISTS nurses (
    nurse_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    nurse_code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    qualification VARCHAR(255),
    specialization VARCHAR(255),
    experience_years INT,
    registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_council VARCHAR(100),
    address TEXT,
    emergency_contact VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    profile_photo VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 10. STAFF_BRANCHES TABLE (Mapping)
CREATE TABLE IF NOT EXISTS staff_branches (
    staff_hospital_id SERIAL PRIMARY KEY,
    staff_id INT NOT NULL,
    branch_id INT NOT NULL,
    department_id INT,
    joining_date DATE,
    employment_type VARCHAR(20) CHECK (employment_type IN ('Permanent', 'Contract', 'Temporary', 'Consultant')) DEFAULT 'Permanent',
    position VARCHAR(100),
    salary DECIMAL(12, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staff_id) REFERENCES staff(staff_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    UNIQUE (staff_id, branch_id)
);

-- 11. DOCTOR_BRANCHES TABLE (Mapping)
CREATE TABLE IF NOT EXISTS doctor_branches (
    doc_hospital_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    joining_date DATE,
    employment_type VARCHAR(20) CHECK (employment_type IN ('Permanent', 'Visiting', 'Consultant', 'Contract')) DEFAULT 'Permanent',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, branch_id)
);

-- 12. DOCTOR_DEPARTMENTS TABLE (Mapping)
CREATE TABLE IF NOT EXISTS doctor_departments (
    doc_dept_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    department_id INT NOT NULL,
    is_primary_department BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, department_id)
);

-- 13. DOCTOR_BRANCH_DEPARTMENTS TABLE (Mapping)
CREATE TABLE IF NOT EXISTS doctor_branch_departments (
    doc_hosp_dept_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    department_id INT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE CASCADE,
    UNIQUE (doctor_id, branch_id, department_id)
);

-- 14. NURSE_BRANCHES TABLE (Mapping)
CREATE TABLE IF NOT EXISTS nurse_branches (
    nurse_hospital_id SERIAL PRIMARY KEY,
    nurse_id INT NOT NULL,
    branch_id INT NOT NULL,
    department_id INT,
    joining_date DATE,
    employment_type VARCHAR(20) CHECK (employment_type IN ('Permanent', 'Contract', 'Temporary')) DEFAULT 'Permanent',
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nurse_id) REFERENCES nurses(nurse_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    UNIQUE (nurse_id, branch_id)
);

-- 15. SHIFTS TABLE
CREATE TABLE IF NOT EXISTS shifts (
    shift_id SERIAL PRIMARY KEY,
    shift_name VARCHAR(100) NOT NULL,
    shift_code VARCHAR(50) UNIQUE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_hours DECIMAL(4, 2),
    shift_type VARCHAR(20) CHECK (shift_type IN ('Morning', 'Evening', 'Night', 'General')) DEFAULT 'General',
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 16. SHIFT_BRANCHES TABLE (Mapping)
CREATE TABLE IF NOT EXISTS shift_branches (
    shift_hospital_id SERIAL PRIMARY KEY,
    shift_id INT NOT NULL,
    branch_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    UNIQUE (shift_id, branch_id)
);

-- 17. NURSE_SHIFTS TABLE
CREATE TABLE IF NOT EXISTS nurse_shifts (
    nurse_shift_id SERIAL PRIMARY KEY,
    nurse_id INT NOT NULL,
    branch_id INT NOT NULL,
    shift_id INT NOT NULL,
    department_id INT,
    shift_date DATE NOT NULL,
    attendance_status VARCHAR(20) CHECK (attendance_status IN ('Present', 'Absent', 'Late', 'Half-day', 'On-leave')) DEFAULT 'Present',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (nurse_id) REFERENCES nurses(nurse_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 18. DOCTOR_SHIFTS TABLE
CREATE TABLE IF NOT EXISTS doctor_shifts (
    doctor_shift_id SERIAL PRIMARY KEY,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    shift_id INT NOT NULL,
    department_id INT,
    shift_date DATE NOT NULL,
    attendance_status VARCHAR(20) CHECK (attendance_status IN ('Present', 'Absent', 'Late', 'Half-day', 'On-leave')) DEFAULT 'Present',
    check_in_time TIMESTAMP NULL,
    check_out_time TIMESTAMP NULL,
    patients_attended INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (shift_id) REFERENCES shifts(shift_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- 19. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    mrn_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    patient_code VARCHAR(50) UNIQUE NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth DATE,
    age INT,
    blood_group VARCHAR(5) CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_number VARCHAR(20),
    emergency_contact_relation VARCHAR(50),
    aadhar_number VARCHAR(12),
    insurance_provider VARCHAR(100),
    insurance_policy_number VARCHAR(100),
    medical_history TEXT,
    allergies TEXT,
    current_medications TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    registration_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 20. APPOINTMENTS TABLE
CREATE TABLE IF NOT EXISTS appointments (
    appointment_id SERIAL PRIMARY KEY,
    appointment_number VARCHAR(50) UNIQUE NOT NULL,
    patient_name VARCHAR(200),
    phone_number VARCHAR(20),
    email VARCHAR(100),
    age INT,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    patient_id INT,
    doctor_id INT NOT NULL,
    branch_id INT NOT NULL,
    department_id INT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    reason_for_visit TEXT,
    appointment_status VARCHAR(20) CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Checked-in', 'Completed', 'Cancelled', 'No-show')) DEFAULT 'Scheduled',
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confirmed_by INT,
    cancelled_by INT,
    cancellation_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (confirmed_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (cancelled_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 21. OPD_ENTRIES TABLE
CREATE TABLE IF NOT EXISTS opd_entries (
    opd_id SERIAL PRIMARY KEY,
    opd_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    branch_id INT NOT NULL,
    department_id INT,
    doctor_id INT NOT NULL,
    appointment_id INT,
    visit_type VARCHAR(20) CHECK (visit_type IN ('Walk-in', 'Follow-up', 'Emergency', 'Referral')) DEFAULT 'Walk-in',
    visit_date DATE NOT NULL,
    visit_time TIME,
    token_number VARCHAR(20),
    reason_for_visit TEXT,
    symptoms TEXT,
    vital_signs JSONB,
    chief_complaint TEXT,
    diagnosis TEXT,
    prescription TEXT,
    lab_tests_ordered TEXT,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    consultation_fee DECIMAL(10, 2),
    payment_status VARCHAR(20) CHECK (payment_status IN ('Paid', 'Pending', 'Partial', 'Waived')) DEFAULT 'Pending',
    visit_status VARCHAR(20) CHECK (visit_status IN ('Registered', 'In-consultation', 'Completed', 'Cancelled')) DEFAULT 'Registered',
    checked_in_time TIMESTAMP NULL,
    consultation_start_time TIMESTAMP NULL,
    consultation_end_time TIMESTAMP NULL,
    checked_in_by INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id) ON DELETE SET NULL,
    FOREIGN KEY (checked_in_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 22. SERVICES TABLE
CREATE TABLE IF NOT EXISTS services (
    service_id SERIAL PRIMARY KEY,
    service_code VARCHAR(50) UNIQUE NOT NULL,
    service_name VARCHAR(200) NOT NULL,
    description TEXT,
    service_category VARCHAR(100),
    default_unit_price DECIMAL(10, 2),
    hsn_code VARCHAR(20),
    is_taxable BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 23. BILLINGS TABLE
CREATE TABLE IF NOT EXISTS billings (
    bill_id SERIAL PRIMARY KEY,
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id INT NOT NULL,
    branch_id INT NOT NULL,
    opd_id INT,
    admission_id INT,
    bill_date DATE NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    tax_amount DECIMAL(12, 2) DEFAULT 0,
    net_payable DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) DEFAULT 0,
    bill_status VARCHAR(20) CHECK (bill_status IN ('Draft', 'Generated', 'Paid', 'Partial', 'Cancelled')) DEFAULT 'Draft',
    payment_method VARCHAR(20) CHECK (payment_method IN ('Cash', 'Card', 'UPI', 'Net-banking', 'Insurance', 'Cheque', 'Other')),
    insurance_claim_id VARCHAR(100),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (opd_id) REFERENCES opd_entries(opd_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 24. BILLING_ITEMS TABLE
CREATE TABLE IF NOT EXISTS billing_items (
    bill_item_id SERIAL PRIMARY KEY,
    bill_id INT NOT NULL,
    service_id INT,
    item_code VARCHAR(50),
    quantity INT DEFAULT 1,
    unit_price DECIMAL(10, 2) NOT NULL,
    item_total DECIMAL(12, 2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    doctor_id INT,
    department_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (bill_id) REFERENCES billings(bill_id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE SET NULL,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);

CREATE INDEX IF NOT EXISTS idx_branches_hospital ON branches(hospital_id);
CREATE INDEX IF NOT EXISTS idx_branches_active ON branches(is_active);

CREATE INDEX IF NOT EXISTS idx_doctors_user ON doctors(user_id);
CREATE INDEX IF NOT EXISTS idx_doctors_registration ON doctors(registration_number);

CREATE INDEX IF NOT EXISTS idx_nurses_user ON nurses(user_id);
CREATE INDEX IF NOT EXISTS idx_nurses_registration ON nurses(registration_number);

CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn_number);
CREATE INDEX IF NOT EXISTS idx_patients_contact ON patients(contact_number);
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);

CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(appointment_status);

CREATE INDEX IF NOT EXISTS idx_opd_date ON opd_entries(visit_date);
CREATE INDEX IF NOT EXISTS idx_opd_patient ON opd_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_opd_doctor ON opd_entries(doctor_id);

CREATE INDEX IF NOT EXISTS idx_billings_date ON billings(bill_date);
CREATE INDEX IF NOT EXISTS idx_billings_patient ON billings(patient_id);
CREATE INDEX IF NOT EXISTS idx_billings_status ON billings(bill_status);

-- =============================================
-- TRIGGERS FOR AUTO-UPDATE TIMESTAMPS
-- =============================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_branch_departments_updated_at BEFORE UPDATE ON branch_departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurses_updated_at BEFORE UPDATE ON nurses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_branches_updated_at BEFORE UPDATE ON staff_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_branches_updated_at BEFORE UPDATE ON doctor_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_branches_updated_at BEFORE UPDATE ON nurse_branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nurse_shifts_updated_at BEFORE UPDATE ON nurse_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_doctor_shifts_updated_at BEFORE UPDATE ON doctor_shifts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_opd_entries_updated_at BEFORE UPDATE ON opd_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billings_updated_at BEFORE UPDATE ON billings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
