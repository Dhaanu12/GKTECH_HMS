-- Seed Sample Clinical Notes Data for Testing
-- Adds clinical notes for patients in branch 55 (Care 24 Medical Centre & Hospital)

DO $$
DECLARE
    user_id_var INT;
    patient_rec RECORD;
    note_count INT := 0;
BEGIN
    -- Get a user ID for created_by
    SELECT user_id INTO user_id_var FROM users WHERE email = 'olivia.brown@care24.in' LIMIT 1;
    IF user_id_var IS NULL THEN
        user_id_var := 1;
    END IF;

    -- Loop through patients with OPD entries in branch 55
    FOR patient_rec IN 
        SELECT DISTINCT 
            p.patient_id, 
            o.opd_id,
            o.branch_id
        FROM patients p
        JOIN opd_entries o ON p.patient_id = o.patient_id
        WHERE o.branch_id = 55
        LIMIT 10
    LOOP
        -- Initial Assessment Note (pinned)
        INSERT INTO clinical_notes (
            patient_id, opd_id, branch_id, note_type, title, content,
            is_pinned, created_by, created_at
        ) VALUES (
            patient_rec.patient_id,
            patient_rec.opd_id,
            55,
            'Assessment',
            'Initial Assessment',
            CASE (random() * 3)::int
                WHEN 0 THEN 'Patient presents with mild symptoms. Vital signs stable. No immediate concerns. Recommended follow-up in 2 weeks.'
                WHEN 1 THEN 'Chief complaint of persistent headache for 3 days. No fever or nausea. BP slightly elevated. Advised rest and hydration.'
                WHEN 2 THEN 'Routine check-up. Patient reports general wellness. All vitals within normal range. Continue current medications.'
                ELSE 'Patient complains of fatigue and mild body aches. No respiratory symptoms. Temperature normal. Advised symptomatic treatment.'
            END,
            true,
            user_id_var,
            NOW() - (random() * 10)::int * INTERVAL '1 day'
        );

        -- Nursing Note
        INSERT INTO clinical_notes (
            patient_id, opd_id, branch_id, note_type, title, content,
            created_by, created_at
        ) VALUES (
            patient_rec.patient_id,
            patient_rec.opd_id,
            55,
            'Nursing',
            NULL,
            CASE (random() * 3)::int
                WHEN 0 THEN 'Vitals recorded. Patient comfortable and responsive. IV line in place and functioning. Medication administered as prescribed.'
                WHEN 1 THEN 'Patient resting comfortably. Pain level 2/10. Encouraged oral fluid intake. Will continue monitoring.'
                WHEN 2 THEN 'Assisted patient with morning routine. Wound dressing changed. No signs of infection. Patient ambulatory.'
                ELSE 'Patient stable. Administered prescribed medications. Educated patient on medication schedule. No adverse reactions noted.'
            END,
            user_id_var,
            NOW() - (random() * 7)::int * INTERVAL '1 day'
        );

        -- Progress Note
        INSERT INTO clinical_notes (
            patient_id, opd_id, branch_id, note_type, title, content,
            created_by, created_at
        ) VALUES (
            patient_rec.patient_id,
            patient_rec.opd_id,
            55,
            'Progress',
            'Daily Progress Update',
            CASE (random() * 3)::int
                WHEN 0 THEN 'Patient showing improvement. Appetite good. Sleep quality improved. Continuing current treatment plan.'
                WHEN 1 THEN 'Condition stable. Patient reports feeling better than yesterday. Vitals trending toward normal.'
                WHEN 2 THEN 'Good progress noted. Patient active and mobile. Pain well controlled. Discharge planning initiated.'
                ELSE 'Patient condition improved. Lab results pending. Continue monitoring and current medications.'
            END,
            user_id_var,
            NOW() - (random() * 5)::int * INTERVAL '1 day'
        );

        -- Medication Note
        INSERT INTO clinical_notes (
            patient_id, opd_id, branch_id, note_type, title, content,
            created_by, created_at
        ) VALUES (
            patient_rec.patient_id,
            patient_rec.opd_id,
            55,
            'Medication',
            'Medication Review',
            CASE (random() * 2)::int
                WHEN 0 THEN 'Current medications reviewed. No interactions noted. Patient tolerating all medications well. Continue as prescribed.'
                WHEN 1 THEN 'Medication adjustment made per physician orders. New prescription added for symptom management. Patient counseled on side effects.'
                ELSE 'All medications administered on schedule. Patient reports compliance at home. No adverse effects reported.'
            END,
            user_id_var,
            NOW() - (random() * 3)::int * INTERVAL '1 day'
        );

        -- Follow-up Note
        INSERT INTO clinical_notes (
            patient_id, opd_id, branch_id, note_type, title, content,
            created_by, created_at
        ) VALUES (
            patient_rec.patient_id,
            patient_rec.opd_id,
            55,
            'Follow-up',
            NULL,
            CASE (random() * 2)::int
                WHEN 0 THEN 'Follow-up visit scheduled for next week. Patient advised to continue medications and return if symptoms worsen.'
                WHEN 1 THEN 'Patient to return in 2 weeks for follow-up. Lab work ordered for next visit. Continue current management.'
                ELSE 'Discharged with follow-up appointment. Patient understands discharge instructions and warning signs to watch for.'
            END,
            user_id_var,
            NOW() - (random() * 2)::int * INTERVAL '1 day'
        );

        note_count := note_count + 5;
    END LOOP;

    RAISE NOTICE 'Inserted % clinical notes', note_count;
END $$;

-- Show summary
SELECT 
    'Clinical Notes Summary' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE is_pinned = true) as pinned,
    COUNT(DISTINCT patient_id) as patients_with_notes
FROM clinical_notes
WHERE branch_id = 55;

-- Show breakdown by type
SELECT note_type, COUNT(*) as count
FROM clinical_notes
WHERE branch_id = 55
GROUP BY note_type
ORDER BY count DESC;
