-- Migration: Create refund_transactions table
-- Description: Creates the refund_transactions table linked to billing_master.

CREATE TABLE IF NOT EXISTS refund_transactions (
    refund_id SERIAL PRIMARY KEY,
    
    -- Foreign Key to billing_master
    bill_master_id INT NOT NULL,
    FOREIGN KEY (bill_master_id) REFERENCES billing_master(bill_master_id) ON DELETE CASCADE,
    
    -- Soft reference to payment_transactions
    original_payment_id INT,
    
    refund_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    refund_amount DECIMAL(10,2) NOT NULL,
    
    -- Enum: 'Cash', 'Card_Reversal', 'UPI', 'Cheque', 'Bank_Transfer'
    refund_mode VARCHAR(20) NOT NULL CHECK (refund_mode IN ('Cash', 'Card_Reversal', 'UPI', 'Cheque', 'Bank_Transfer')),
    
    refund_reason TEXT NOT NULL,
    
    -- JSON array of bill_detail_ids
    refund_items TEXT,
    
    -- Soft references
    requested_by INT NOT NULL,
    approved_by INT,
    approved_at TIMESTAMP,
    
    transaction_reference VARCHAR(100),
    remarks TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_refund_transactions_bill_master ON refund_transactions(bill_master_id);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_refund_date ON refund_transactions(refund_date);
CREATE INDEX IF NOT EXISTS idx_refund_transactions_refund_mode ON refund_transactions(refund_mode);
