-- Migration: Create billing_master table
-- Description: Creates the billing_master table with specified fields and constraints.

CREATE TABLE IF NOT EXISTS billing_master (
    bill_master_id SERIAL PRIMARY KEY,
    bill_number VARCHAR(36) UNIQUE NOT NULL,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    opd_id INT NOT NULL,
    opd_number VARCHAR(255) NOT NULL,
    branch_id INT NOT NULL,
    department_id INT,
    patient_id INT NOT NULL,
    mrn_number VARCHAR(20) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    patient_address TEXT,
    contact_number VARCHAR(15) NOT NULL,
    contact_email VARCHAR(255),
    
    -- Enum: 'OPD', 'IPD', 'Emergency', 'Pharmacy'
    invoice_type VARCHAR(20) CHECK (invoice_type IN ('OPD', 'IPD', 'Emergency', 'Pharmacy')) DEFAULT 'OPD',
    
    billing_date DATE NOT NULL,
    due_date DATE,
    
    -- Financial Fields
    subtotal_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Enum: 'percentage', 'fixed', 'none'
    discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed', 'none')) DEFAULT 'none',
    
    discount_value DECIMAL(10,2) DEFAULT 0.00,
    total_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_reason VARCHAR(255),
    discount_approved_by VARCHAR(255),
    
    -- Tax Fields
    tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    cgst_amount DECIMAL(10,2) DEFAULT 0.00,
    sgst_amount DECIMAL(10,2) DEFAULT 0.00, 
    igst_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Bill Amount
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    pending_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Status Fields
    -- Enum: 'Draft', 'Pending', 'Partial', 'Paid', 'Cancelled'
    status VARCHAR(20) CHECK (status IN ('Draft', 'Pending', 'Partial', 'Paid', 'Cancelled')) DEFAULT 'Pending',
    
    -- Enum: 'Unpaid', 'Partial', 'Paid'
    payment_status VARCHAR(20) CHECK (payment_status IN ('Unpaid', 'Partial', 'Paid')) DEFAULT 'Unpaid',
    
    -- Enum: 'Cash', 'Card', 'Debit_Card', 'Credit_Card', 'UPI', 'Net_Banking', 'Cheque', 'Insurance'
    payment_mode VARCHAR(20) CHECK (payment_mode IN ('Cash', 'Card', 'Debit_Card', 'Credit_Card', 'UPI', 'Net_Banking', 'Cheque', 'Insurance')) NOT NULL,
    
    -- Insurance Fields
    insurance_company_id INT,
    insurance_claim_amount DECIMAL(10,2) DEFAULT 0.00,
    insurance_policy_number VARCHAR(50),
    
    -- Notes
    remarks TEXT,
    internal_notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_billing_master_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_master_timestamp ON billing_master;

CREATE TRIGGER update_billing_master_timestamp
    BEFORE UPDATE ON billing_master
    FOR EACH ROW EXECUTE FUNCTION update_billing_master_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_billing_master_bill_number ON billing_master(bill_number);
CREATE INDEX IF NOT EXISTS idx_billing_master_invoice_number ON billing_master(invoice_number);
CREATE INDEX IF NOT EXISTS idx_billing_master_patient_id ON billing_master(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_master_opd_id ON billing_master(opd_id);
CREATE INDEX IF NOT EXISTS idx_billing_master_billing_date ON billing_master(billing_date);
CREATE INDEX IF NOT EXISTS idx_billing_master_status ON billing_master(status);
