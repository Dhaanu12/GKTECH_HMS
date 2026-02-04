-- Migration: Add Marketing and Accountant Manager Roles
-- Ensuring standard role codes are used.

INSERT INTO roles (role_name, role_code, description, is_active) VALUES
('Marketing Executive', 'MRKT_EXEC', 'Marketing Executive Staff', true),
('Marketing Manager', 'MRKT_MNGR', 'Marketing Manager Staff', true),
('Accounts Manager', 'ACCOUNTANT_MANAGER', 'Accounts Manager Staff', true),
('Accountant', 'ACCOUNTANT', 'Accountant Staff', true)
ON CONFLICT (role_code) DO NOTHING;
