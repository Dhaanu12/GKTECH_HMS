-- Insert Common Hospital Departments
-- This file adds standard hospital departments to the departments table

INSERT INTO departments (department_name, department_code, description, is_active) VALUES
('Cardiology', 'CARD', 'Heart and cardiovascular system care', TRUE),
('Pediatrics', 'PEDI', 'Medical care for infants, children, and adolescents', TRUE),
('Orthopedics', 'ORTH', 'Musculoskeletal system treatment', TRUE),
('Neurology', 'NEUR', 'Nervous system disorders treatment', TRUE),
('General Surgery', 'SURG', 'Surgical procedures and operations', TRUE),
('Emergency Medicine', 'EMER', '24/7 emergency and trauma care', TRUE),
('Radiology', 'RADI', 'Medical imaging and diagnostics', TRUE),
('Obstetrics & Gynecology', 'OBGY', 'Women''s health and childbirth', TRUE),
('Dermatology', 'DERM', 'Skin, hair, and nail disorders', TRUE),
('ENT (Otolaryngology)', 'ENT', 'Ear, nose, and throat treatment', TRUE),
('Ophthalmology', 'OPHT', 'Eye care and vision treatment', TRUE),
('Psychiatry', 'PSYC', 'Mental health and behavioral disorders', TRUE),
('Internal Medicine', 'INTM', 'Adult disease prevention and treatment', TRUE),
('Anesthesiology', 'ANES', 'Anesthesia and pain management', TRUE),
('Oncology', 'ONCO', 'Cancer treatment and care', TRUE),
('Nephrology', 'NEPH', 'Kidney disease treatment', TRUE),
('Gastroenterology', 'GAST', 'Digestive system disorders', TRUE),
('Endocrinology', 'ENDO', 'Hormone and gland disorders', TRUE),
('Urology', 'UROL', 'Urinary tract and male reproductive system', TRUE),
('Pulmonology', 'PULM', 'Respiratory system and lung diseases', TRUE),
('Physiotherapy', 'PHYS', 'Physical rehabilitation and therapy', TRUE),
('Pathology', 'PATH', 'Laboratory testing and disease diagnosis', TRUE),
('Pharmacy', 'PHAR', 'Medication and pharmaceutical services', TRUE),
('Intensive Care Unit (ICU)', 'ICU', 'Critical care for severe conditions', TRUE),
('Dental', 'DENT', 'Oral and dental health care', TRUE)
ON CONFLICT (department_code) DO NOTHING;
