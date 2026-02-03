-- Migration: Add Modules and Marketing Tables

-- 1. MODULES TABLE
CREATE TABLE IF NOT EXISTS modules (
    module_id SERIAL PRIMARY KEY,
    module_code VARCHAR(50) UNIQUE NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    field1 VARCHAR(255),
    field2 VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 2. CLIENT_MODULES TABLE (Mapping Modules to Clients/Tenants)
CREATE TABLE IF NOT EXISTS client_modules (
    client_module_id SERIAL PRIMARY KEY,
    client_id INT NOT NULL, -- Assuming 'client' refers to 'hospitals' based on context, or a new 'clients' table? Context implies Hospital. Using hospital_id foreign key.
    module_id INT NOT NULL,
    registered_date DATE DEFAULT CURRENT_DATE,
    marketing_id INT, -- Unsure of relation, keeping as INT
    status VARCHAR(20) DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES modules(module_id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL,
    UNIQUE(client_id, module_id)
);

-- 3. REFERRAL_DOCTOR TABLE (Marketing Executive Entry)
CREATE TABLE IF NOT EXISTS referral_doctor (
    id SERIAL PRIMARY KEY,
    department_id INT,
    doctor_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20),
    speciality_type VARCHAR(100),
    medical_council_membership_number VARCHAR(100),
    council VARCHAR(100),
    pan_card_number VARCHAR(255), -- Encrypted
    aadhar_card_number VARCHAR(255), -- Encrypted
    bank_name VARCHAR(100),
    bank_branch VARCHAR(100),
    bank_address TEXT,
    bank_account_number VARCHAR(50),
    bank_ifsc_code VARCHAR(20),
    photo_upload_path VARCHAR(255),
    pan_upload_path VARCHAR(255),
    aadhar_upload_path VARCHAR(255),
    referral_pay CHAR(1) DEFAULT 'N', -- Y/N
    tenant_id INT, -- Hospital ID of Marketing Executive
    marketing_spoc VARCHAR(100),
    introduced_by VARCHAR(100),
    status VARCHAR(20) DEFAULT 'Pending',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Geolocation fields
    geo_latitude DECIMAL(10, 8),
    geo_longitude DECIMAL(11, 8),
    geo_accuracy DECIMAL(10, 2),
    geo_altitude DECIMAL(10, 2),
    geo_altitude_accuracy DECIMAL(10, 2),
    geo_heading DECIMAL(10, 2),
    geo_speed DECIMAL(10, 2),
    geo_timestamp TIMESTAMP,
    
    FOREIGN KEY (department_id) REFERENCES departments(department_id) ON DELETE SET NULL,
    FOREIGN KEY (tenant_id) REFERENCES hospitals(hospital_id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- 4. REFERRAL_DOCTOR_SERVICE_PERCENTAGE TABLE (Accounts Entry)
CREATE TABLE IF NOT EXISTS referral_doctor_service_percentage (
    percentage_id SERIAL PRIMARY KEY,
    referral_doctor_id INT NOT NULL,
    service_type VARCHAR(100),
    referral_pay CHAR(1) DEFAULT 'N', -- Y/N
    cash_percentage DECIMAL(5, 2) DEFAULT 0,
    inpatient_percentage DECIMAL(5, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'Active',
    created_by INT,
    updated_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_doctor_id) REFERENCES referral_doctor(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Add Triggers for updated_at (assuming update_updated_at_column function exists from schema.sql)
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_client_modules_updated_at BEFORE UPDATE ON client_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_doctor_updated_at BEFORE UPDATE ON referral_doctor
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referral_doctor_service_percentage_updated_at BEFORE UPDATE ON referral_doctor_service_percentage
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
