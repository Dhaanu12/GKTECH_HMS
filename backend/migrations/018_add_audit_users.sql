-- Migration: Add audit user columns to billing_master
-- Description: Adds created_by and updated_by columns as soft references.

ALTER TABLE billing_master
ADD COLUMN IF NOT EXISTS created_by INT,
ADD COLUMN IF NOT EXISTS updated_by INT;

-- Add indexes for performance optimization on these foreign keys
CREATE INDEX IF NOT EXISTS idx_billing_master_created_by ON billing_master(created_by);
CREATE INDEX IF NOT EXISTS idx_billing_master_updated_by ON billing_master(updated_by);
