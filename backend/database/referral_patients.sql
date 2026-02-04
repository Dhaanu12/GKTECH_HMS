CREATE TABLE IF NOT EXISTS referral_patients (
    id SERIAL PRIMARY KEY,
    referral_patient_id VARCHAR(50) UNIQUE,
    patient_name VARCHAR(100) NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    gender VARCHAR(10) CHECK (gender IN ('Male', 'Female', 'Other')),
    age INT,
    place VARCHAR(100),
    referral_doctor_id INT,
    payment_type VARCHAR(20) CHECK (payment_type IN ('Cash', 'Insurance')) DEFAULT 'Cash',
    service_required VARCHAR(255),
    status VARCHAR(20) DEFAULT 'Pending', -- Pending, Converted, Not Interested
    remarks TEXT,
    created_by VARCHAR(50), -- User ID or Username
    marketing_spoc VARCHAR(50), -- User ID of the marketing exec
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (referral_doctor_id) REFERENCES referral_doctor_module(id) ON DELETE SET NULL
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_referral_patients_doctor ON referral_patients(referral_doctor_id);
CREATE INDEX IF NOT EXISTS idx_referral_patients_mobile ON referral_patients(mobile_number);
