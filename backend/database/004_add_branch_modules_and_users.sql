-- Migration: Add Branch Support to Modules and Ensure Roles

-- 1. Ensure Roles Exist
INSERT INTO roles (role_name, role_code, description, is_active) VALUES
('Super Admin', 'SUPER_ADMIN', 'System Administrator', true),
('Client Admin', 'CLIENT_ADMIN', 'Hospital Administrator', true),
('Doctor', 'DOCTOR', 'Medical Doctor', true),
('Nurse', 'NURSE', 'Nursing Staff', true),
('Receptionist', 'RECEPTIONIST', 'Front Desk', true),
('Pharmacist', 'PHARMACIST', 'Pharmacy Staff', true),
('Lab Technician', 'LAB_TECH', 'Lab Staff', true),
('Accountant', 'ACCOUNTANT', 'Accounts Staff', true),
('Marketing Executive', 'MARKETING_EXECUTIVE', 'Marketing Staff', true)
ON CONFLICT (role_code) DO NOTHING;

-- 2. Modify CLIENT_MODULES table to support Branch Assignment
-- Add branch_id column
ALTER TABLE client_modules ADD COLUMN IF NOT EXISTS branch_id INT;

-- Add Foreign Key constraint
ALTER TABLE client_modules 
    DROP CONSTRAINT IF EXISTS client_modules_branch_id_fkey,
    ADD CONSTRAINT client_modules_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE;

-- Update Unique Constraint to include branch_id
-- We need to drop the old unique constraint (client_id, module_id) and add a new one.
-- But wait, we might still want to allow "Global" assignment (branch_id IS NULL)?
-- If branch_id IS NULL, it applies to the whole hospital? Or should we enforce branch assignment?
-- Use Case: "add modules to that hospital branch". implying granular control.
-- Let's execute based on: Unique (client_id, module_id, branch_id) where branch_id can be NULL (treated as distinct from specific branch, or maybe NULL means all?)
-- Postgres UNIQUE treats NULLs as distinct. So (1, 1, NULL) != (1, 1, NULL) is NOT true, actually (1, 1, NULL) allows multiple if NULLs are distinct options depending on PG version/settings, but usually standard SQL says NULL != NULL. 
-- However, PG 15+ allows NULLs NOT DISTINCT. 
-- For simplicity: We will drop the strict unique constraint on (client_id, module_id) constraint if it exists.
-- And add a composite unique index that allows multiple same modules for different branches.

ALTER TABLE client_modules DROP CONSTRAINT IF EXISTS client_modules_client_id_module_id_key;

-- We'll just add a unique index to prevent duplicate assignment for the SAME branch.
-- If branch_id is NULL (Hospital Level), we might want only one per hospital.
-- A partial unique index for NULL branch:
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_modules_hospital_level 
ON client_modules (client_id, module_id) 
WHERE branch_id IS NULL;

-- A unique index for Specific Branch:
CREATE UNIQUE INDEX IF NOT EXISTS idx_client_modules_branch_level 
ON client_modules (client_id, module_id, branch_id) 
WHERE branch_id IS NOT NULL;

-- 3. Update Audit fields for client_modules just in case
ALTER TABLE client_modules ALTER COLUMN created_by TYPE VARCHAR(100);
ALTER TABLE client_modules ALTER COLUMN updated_by TYPE VARCHAR(100);
