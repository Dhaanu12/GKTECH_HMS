-- Create referral_payments table to store GST calculations and payment records
CREATE TABLE IF NOT EXISTS referral_payments (
    payment_id SERIAL PRIMARY KEY,
    uuid UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    
    -- Reference to referral doctor
    referral_doctor_id INT NOT NULL,
    
    -- Service details
    hosp_service_id INT,
    service_code VARCHAR(50),
    service_name VARCHAR(200),
    
    -- Financial details
    service_amount NUMERIC(12,2) NOT NULL,
    referral_percentage NUMERIC(5,2) NOT NULL,
    referral_amount NUMERIC(12,2) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL,
    gst_amount NUMERIC(12,2) NOT NULL,
    total_payable NUMERIC(12,2) NOT NULL,
    
    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'Pending',
    payment_date DATE,
    payment_mode VARCHAR(50),
    payment_reference VARCHAR(100),
    
    -- Patient/billing reference (optional)
    patient_id INT,
    billing_id INT,
    opd_id INT,
    
    -- Notes
    remarks TEXT,
    
    -- Audit fields
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    updated_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Kolkata'),
    
    -- Foreign keys
    FOREIGN KEY (referral_doctor_id) REFERENCES referral_doctor(id) ON DELETE CASCADE,
    FOREIGN KEY (hosp_service_id) REFERENCES hospital_services(hosp_service_id) ON DELETE SET NULL,
    
    -- Constraints
    CONSTRAINT referral_payments_status_check CHECK (payment_status IN ('Pending', 'Paid', 'Cancelled', 'On-hold'))
);

-- Add index for faster queries
CREATE INDEX idx_referral_payments_doctor ON referral_payments(referral_doctor_id);
CREATE INDEX idx_referral_payments_status ON referral_payments(payment_status);
CREATE INDEX idx_referral_payments_date ON referral_payments(payment_date);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS update_referral_payments_updated_at ON referral_payments;
CREATE TRIGGER update_referral_payments_updated_at 
BEFORE UPDATE ON referral_payments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column_ist();

-- Add comment
COMMENT ON TABLE referral_payments IS 'Stores referral doctor payment calculations and records with GST';
