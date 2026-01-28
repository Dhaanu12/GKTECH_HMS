-- Ensure standard modules exist using correct schema
INSERT INTO modules (module_code, module_name, status, created_by, created_at, updated_at, uuid) VALUES
('doc', 'Doctors', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('nurse', 'Nurses', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('lab', 'Laboratory', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('pharma', 'Pharmacy', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('market', 'Marketing', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('acc', 'Accounts', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('reception', 'Reception', 'Active', 'system', NOW(), NOW(), gen_random_uuid()),
('referral_payment', 'Referral Payment', 'Active', 'system', NOW(), NOW(), gen_random_uuid())
ON CONFLICT (module_code) DO NOTHING;
