-- Ensure Accountant Role Exists
INSERT INTO roles (role_name, role_code, description, is_active)
VALUES ('Accountant', 'ACCOUNTANT', 'Manage financial records and insurance claims', true)
ON CONFLICT (role_code) DO NOTHING;

-- Create Insurance Claims Table
CREATE TABLE IF NOT EXISTS insurance_claims (
    claim_id SERIAL PRIMARY KEY,
    s_no INT,
    ip_no VARCHAR(50),
    patient_name VARCHAR(200),
    doctor_name VARCHAR(200),
    approval_no VARCHAR(100),
    admission_date DATE,
    discharge_date DATE,
    department VARCHAR(100),
    insurance_name VARCHAR(200),
    bill_amount DECIMAL(15, 2),
    advance_amount DECIMAL(15, 2),
    co_pay DECIMAL(15, 2),
    discount DECIMAL(15, 2),
    approval_amount DECIMAL(15, 2),
    amount_received DECIMAL(15, 2),
    pending_amount DECIMAL(15, 2),
    tds DECIMAL(15, 2),
    bank_name VARCHAR(200),
    transaction_date DATE,
    utr_no VARCHAR(100),
    remarks TEXT,
    branch_id INT,
    hospital_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(hospital_id) ON DELETE CASCADE
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_insurance_claims_updated_at ON insurance_claims;
CREATE TRIGGER update_insurance_claims_updated_at
BEFORE UPDATE ON insurance_claims
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
