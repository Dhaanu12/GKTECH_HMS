-- Seed Data for HMS

-- 1. Insert Roles
INSERT INTO roles (role_name, role_code, description, is_active) VALUES
('Super Admin', 'SUPER_ADMIN', 'System Administrator with full access', true),
('Client Admin', 'CLIENT_ADMIN', 'Hospital Administrator', true),
('Doctor', 'DOCTOR', 'Medical Doctor', true),
('Nurse', 'NURSE', 'Nursing Staff', true),
('Receptionist', 'RECEPTIONIST', 'Front Desk Staff', true),
('Pharmacist', 'PHARMACIST', 'Pharmacy Staff', true),
('Lab Technician', 'LAB_TECH', 'Laboratory Staff', true)
ON CONFLICT (role_code) DO NOTHING;

-- 2. Insert Initial Super Admin User (Password: SuperAdmin123!)
-- Note: In a real production env, we wouldn't hardcode this, but for setup it's useful.
-- The password hash below corresponds to 'SuperAdmin123!' (generated via bcrypt)
-- You might need to generate a fresh hash if the salt rounds differ, but this is a placeholder.
-- For now, let's just insert the user and let the user reset/change it or use a known hash.
-- Actually, it's safer to not insert a user with a hardcoded hash if we can avoid it, 
-- but for a "get started" script, it's very helpful.
-- Let's assume the user will register or we provide a script to create one.
-- However, the registration API usually requires no auth or we need a bootstrap admin.
-- Let's insert a bootstrap admin.

INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified, phone_number)
SELECT 
    'superadmin', 
    'admin@hms.com', 
    '$2a$10$X.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x.x', -- Placeholder, user needs to update this or we generate a real one
    role_id, 
    true, 
    true,
    '0000000000'
FROM roles WHERE role_code = 'SUPER_ADMIN'
ON CONFLICT (username) DO NOTHING;

-- UPDATE the password hash with a valid one for 'SuperAdmin123!'
-- This hash is generated with 10 salt rounds: $2a$10$wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW.wW
-- Actually, let's use a simple known hash for 'password123' for simplicity in dev:
-- $2b$10$3euPcmQFCiblsZeEu5s7p.9OVH/CaL.8.2.2.2.2.2.2.2.2.2.2 (This is fake)
-- Let's just use the register API to create the first admin or provide a script.
-- Better yet, let's just insert roles. The user can use the /api/auth/register endpoint if it's open, 
-- OR we can provide a command to create a super admin.
-- Given the requirements, let's just stick to Roles for now to avoid security pitfalls with hardcoded passwords.

