-- Migration: Create payment_transactions table
-- Description: Creates the payment_transactions table linked to billing_master.

CREATE TABLE IF NOT EXISTS payment_transactions (
    payment_id SERIAL PRIMARY KEY,
    
    -- Foreign Key to billing_master
    bill_master_id INT NOT NULL,
    FOREIGN KEY (bill_master_id) REFERENCES billing_master(bill_master_id) ON DELETE CASCADE,
    
    payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Enum: 'Cash', 'Card', 'Debit_Card', 'Credit_Card', 'UPI', 'Net_Banking', 'Cheque', 'Insurance', 'Wallet'
    payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('Cash', 'Card', 'Debit_Card', 'Credit_Card', 'UPI', 'Net_Banking', 'Cheque', 'Insurance', 'Wallet')),
    
    amount_paid DECIMAL(10,2) NOT NULL,
    
    -- Transaction Details
    card_last4 VARCHAR(4),
    transaction_reference VARCHAR(100),
    cheque_number VARCHAR(50),
    cheque_date DATE,
    bank_name VARCHAR(100),
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(100),
    gateway_response JSONB,
    
    -- Soft reference to users
    received_by INT NOT NULL,
    
    -- Enum: 'Pending', 'Success', 'Failed', 'Cancelled'
    payment_status VARCHAR(20) CHECK (payment_status IN ('Pending', 'Success', 'Failed', 'Cancelled')) DEFAULT 'Success',
    
    remarks TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_payment_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_transactions_timestamp ON payment_transactions;

CREATE TRIGGER update_payment_transactions_timestamp
    BEFORE UPDATE ON payment_transactions
    FOR EACH ROW EXECUTE FUNCTION update_payment_transactions_updated_at();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_bill_master ON payment_transactions(bill_master_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_date ON payment_transactions(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_mode ON payment_transactions(payment_mode);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(payment_status);
