-- Create Super Admin User
-- Password: Admin123!
-- This script must be run AFTER schema.sql, auth_tables.sql, and seed_data.sql

-- Insert Super Admin User (password hash for 'Admin123!')
-- The hash below is generated using bcrypt with 10 salt rounds
INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified, phone_number)
SELECT 
    'superadmin', 
    'admin@phchms.com', 
    '$2b$10$vI8aWBnW3fid.lH77luLDuLkXjz8m9JrKPgvQwQyKKXvJQpZ1XxU6', 
    role_id, 
    true, 
    true,
    '1234567890'
FROM roles WHERE role_code = 'SUPER_ADMIN'
ON CONFLICT (username) DO UPDATE 
SET password_hash = EXCLUDED.password_hash,
    email = EXCLUDED.email;

-- Verify the user was created
SELECT u.user_id, u.username, u.email, r.role_name, r.role_code 
FROM users u 
JOIN roles r ON u.role_id = r.role_id 
WHERE u.username = 'superadmin';
