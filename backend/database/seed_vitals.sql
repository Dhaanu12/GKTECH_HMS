-- Seed Sample Vitals Data for Testing
-- This adds vitals history for patients in branch 55 (Care 24 Medical Centre & Hospital)

-- Get Olivia's user ID for recorded_by
DO $$
DECLARE
    olivia_user_id INT;
    patient_record RECORD;
BEGIN
    -- Get Olivia's user ID
    SELECT user_id INTO olivia_user_id FROM users WHERE email = 'olivia.brown@care24.in' LIMIT 1;
    
    IF olivia_user_id IS NULL THEN
        RAISE NOTICE 'Olivia user not found, using user_id 1';
        olivia_user_id := 1;
    END IF;
    
    -- Get patients who have OPD entries at branch 55
    FOR patient_record IN 
        SELECT DISTINCT o.patient_id, o.opd_id
        FROM opd_entries o
        WHERE o.branch_id = 55
        LIMIT 5
    LOOP
        -- Insert 4 vitals readings for each patient (over the past week)
        
        -- 7 days ago
        INSERT INTO patient_vitals (
            patient_id, opd_id, branch_id,
            blood_pressure_systolic, blood_pressure_diastolic,
            pulse_rate, temperature, spo2, respiratory_rate,
            weight, height, blood_glucose, pain_level,
            notes, recorded_by, recorded_at
        ) VALUES (
            patient_record.patient_id,
            patient_record.opd_id,
            55,
            120 + (random() * 20)::int,
            75 + (random() * 15)::int,
            70 + (random() * 20)::int,
            98.0 + (random() * 2)::numeric(3,1),
            95 + (random() * 4)::int,
            14 + (random() * 4)::int,
            60 + (random() * 30),
            160 + (random() * 20),
            90 + (random() * 30)::int,
            (random() * 3)::int,
            'Initial admission vitals',
            olivia_user_id,
            NOW() - INTERVAL '7 days'
        );
        
        -- 5 days ago
        INSERT INTO patient_vitals (
            patient_id, opd_id, branch_id,
            blood_pressure_systolic, blood_pressure_diastolic,
            pulse_rate, temperature, spo2, respiratory_rate,
            weight, height, blood_glucose, pain_level,
            notes, recorded_by, recorded_at
        ) VALUES (
            patient_record.patient_id,
            patient_record.opd_id,
            55,
            118 + (random() * 22)::int,
            72 + (random() * 18)::int,
            68 + (random() * 22)::int,
            97.8 + (random() * 2.2)::numeric(3,1),
            94 + (random() * 5)::int,
            13 + (random() * 5)::int,
            60 + (random() * 30),
            160 + (random() * 20),
            85 + (random() * 35)::int,
            (random() * 4)::int,
            'Follow-up vitals - stable',
            olivia_user_id,
            NOW() - INTERVAL '5 days'
        );
        
        -- 3 days ago
        INSERT INTO patient_vitals (
            patient_id, opd_id, branch_id,
            blood_pressure_systolic, blood_pressure_diastolic,
            pulse_rate, temperature, spo2, respiratory_rate,
            weight, height, blood_glucose, pain_level,
            notes, recorded_by, recorded_at
        ) VALUES (
            patient_record.patient_id,
            patient_record.opd_id,
            55,
            122 + (random() * 18)::int,
            76 + (random() * 14)::int,
            72 + (random() * 18)::int,
            98.2 + (random() * 1.8)::numeric(3,1),
            96 + (random() * 3)::int,
            15 + (random() * 3)::int,
            60 + (random() * 30),
            160 + (random() * 20),
            88 + (random() * 32)::int,
            (random() * 2)::int,
            'Morning rounds check',
            olivia_user_id,
            NOW() - INTERVAL '3 days'
        );
        
        -- Today
        INSERT INTO patient_vitals (
            patient_id, opd_id, branch_id,
            blood_pressure_systolic, blood_pressure_diastolic,
            pulse_rate, temperature, spo2, respiratory_rate,
            weight, height, blood_glucose, pain_level,
            notes, recorded_by, recorded_at
        ) VALUES (
            patient_record.patient_id,
            patient_record.opd_id,
            55,
            120 + (random() * 15)::int,
            78 + (random() * 10)::int,
            74 + (random() * 14)::int,
            98.4 + (random() * 1.2)::numeric(3,1),
            97 + (random() * 2)::int,
            16 + (random() * 2)::int,
            60 + (random() * 30),
            160 + (random() * 20),
            92 + (random() * 28)::int,
            (random() * 2)::int,
            'Latest vitals - patient stable',
            olivia_user_id,
            NOW()
        );
        
        RAISE NOTICE 'Inserted 4 vitals for patient_id: %', patient_record.patient_id;
    END LOOP;
END $$;

-- Show what was inserted
SELECT 'Total vitals records in branch 55:' as message, COUNT(*) as count 
FROM patient_vitals WHERE branch_id = 55;

-- Show sample of inserted data
SELECT vital_id, patient_id, 
       blood_pressure_systolic || '/' || blood_pressure_diastolic as bp,
       pulse_rate, temperature, spo2,
       recorded_at::date as date,
       notes
FROM patient_vitals 
WHERE branch_id = 55 
ORDER BY recorded_at DESC 
LIMIT 10;
