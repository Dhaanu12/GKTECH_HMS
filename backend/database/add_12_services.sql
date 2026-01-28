-- Add 12 Real-time Hospital Services
-- Using a logical block to fetch the first valid hospital/branch ID to associate with.

DO $$
DECLARE
    h_id INT;
    b_id INT;
    u_id INT;
BEGIN
    -- unique hospital/branch/user to use using LIMIT 1
    SELECT hospital_id INTO h_id FROM hospitals LIMIT 1;
    SELECT branch_id INTO b_id FROM branches WHERE hospital_id = h_id LIMIT 1;
    SELECT user_id INTO u_id FROM users WHERE email = 'admin@phchms.com' LIMIT 1;

    -- If no branch exists, we can't insert. Safe check.
    IF b_id IS NOT NULL THEN
        
        -- 1. General Physician Consultation
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'CONS-GP', 'General Physician Consultation', 'Standard consultation with a general physician for common ailments.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 2. Specialist Consultation
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'CONS-SPECIAL', 'Specialist Consultation', 'In-depth consultation with a specialist (e.g., Cardiologist, Neurologist).', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 3. Emergency Room Visit
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'EMERG-ER', 'Emergency Room Admission', 'Immediate care service for acute illnesses or trauma.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 4. Nursing Injection / Infusion
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'NURS-INJ', 'Nursing Injection Service', 'Administration of injections or IV fluids by nursing staff.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 5. Complete Blood Count (CBC)
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'LAB-CBC', 'Complete Blood Count (CBC)', 'Blood test to evaluate overall health and detect disorders.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 6. X-Ray Chest PA View
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'RAD-XRAY-CHEST', 'X-Ray Chest (PA View)', 'Radiology imaging for chest diagnostics.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 7. ECG / EKG
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'CARD-ECG', 'Electrocardiogram (ECG)', 'Test to check heart''s rhythm and electrical activity.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 8. Ultrasound Scan (USG)
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'RAD-USG', 'Ultrasound Scan (Abdomen)', 'Diagnostic imaging technique using high-frequency sound waves.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 9. Physiotherapy Session
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'REHAB-PHYSIO', 'Physiotherapy Session (45 min)', 'Rehabilitation session with a certified physiotherapist.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 10. Dental Checkup & Cleaning
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'DENT-CLEAN', 'Dental Checkup & Cleaning', 'Routine dental examination and scaling.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 11. Minor Surgical Procedure
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'SURG-MINOR', 'Minor Surgical Procedure', 'Suturing, dressing change, or minor incision procedures.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

        -- 12. Ambulance Service
        INSERT INTO hospital_services (hospital_id, branch_id, service_code, service_name, service_description, created_by)
        VALUES (h_id, b_id, 'TRANS-AMB', 'Ambulance Service (Local)', 'Emergency patient transport within city limits.', u_id)
        ON CONFLICT (hospital_id, branch_id, service_code) DO NOTHING;

    END IF;
END $$;
