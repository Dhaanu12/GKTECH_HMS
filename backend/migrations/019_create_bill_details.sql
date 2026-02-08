-- Migration: Create bill_details table
-- Description: Creates the bill_details table linked to billing_master.

CREATE TABLE IF NOT EXISTS bill_details (
    bill_detail_id SERIAL PRIMARY KEY,
    
    -- Foreign Key to billing_master
    bill_master_id INT,
    FOREIGN KEY (bill_master_id) REFERENCES billing_master(bill_master_id) ON DELETE CASCADE,
    
    -- Soft references
    branch_id INT NOT NULL,
    department_id INT NOT NULL,
    patient_id INT NOT NULL,
    mrn_number VARCHAR(20) NOT NULL,
    opd_id INT NOT NULL,
    
    -- Service Reference (Soft references)
    -- Enum: 'consultation', 'lab_order', 'procedure', 'pharmacy', 'scan', 'surgery', 'bed_charge', 'other'
    service_type VARCHAR(20) NOT NULL CHECK (service_type IN ('consultation', 'lab_order', 'procedure', 'pharmacy', 'scan', 'surgery', 'bed_charge', 'other')),
    service_reference_id INT,
    
    -- Service Details
    service_code VARCHAR(50),
    service_name VARCHAR(255) NOT NULL,
    service_category VARCHAR(100),
    
    -- Pricing
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    
    -- Line-item Discount
    -- Enum: 'percentage', 'fixed', 'none'
    item_discount_type VARCHAR(20) CHECK (item_discount_type IN ('percentage', 'fixed', 'none')) DEFAULT 'none',
    item_discount_value DECIMAL(10,2) DEFAULT 0.00,
    item_discount_amount DECIMAL(10,2) DEFAULT 0.00,
    item_discount_reason VARCHAR(255),
    
    -- Line-item Tax
    item_tax_percentage DECIMAL(5,2) DEFAULT 0.00,
    item_tax_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Final Price
    final_price DECIMAL(10,2) NOT NULL,
    
    -- Status
    -- Enum: 'Pending', 'Billed', 'Paid', 'Cancelled'
    status VARCHAR(20) CHECK (status IN ('Pending', 'Billed', 'Paid', 'Cancelled')) DEFAULT 'Pending',
    
    -- Cancellation
    is_cancelled BOOLEAN DEFAULT FALSE,
    is_cancellable BOOLEAN DEFAULT TRUE,
    cancellation_reason TEXT,
    cancellation_note TEXT,
    cancelled_by INT, -- Soft reference
    cancelled_at TIMESTAMP,
    
    -- Additional Info
    description TEXT,
    instructions TEXT,
    notes TEXT,
    
    -- Audit
    created_by INT NOT NULL, -- User reference (soft)
    updated_by INT,          -- User reference (soft)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_bill_details_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bill_details_timestamp ON bill_details;

CREATE TRIGGER update_bill_details_timestamp
    BEFORE UPDATE ON bill_details
    FOR EACH ROW EXECUTE FUNCTION update_bill_details_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_details_bill_master ON bill_details(bill_master_id);
CREATE INDEX IF NOT EXISTS idx_bill_details_patient ON bill_details(patient_id);
CREATE INDEX IF NOT EXISTS idx_bill_details_status ON bill_details(status);
CREATE INDEX IF NOT EXISTS idx_bill_details_service_type ON bill_details(service_type);
CREATE INDEX IF NOT EXISTS idx_bill_details_is_cancelled ON bill_details(is_cancelled);
