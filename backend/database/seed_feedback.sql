-- Seed Sample Feedback Data for Testing
-- Adds feedback for patients in branch 55 (Care 24 Medical Centre & Hospital)

DO $$
DECLARE
    user_id_var INT;
    patient_rec RECORD;
    feedback_count INT := 0;
BEGIN
    -- Get a user ID for recorded_by (use user_id 1 as fallback)
    SELECT user_id INTO user_id_var FROM users WHERE email = 'olivia.brown@care24.in' LIMIT 1;
    IF user_id_var IS NULL THEN
        user_id_var := 1;
    END IF;

    -- Loop through patients with OPD entries in branch 55
    FOR patient_rec IN 
        SELECT DISTINCT 
            p.patient_id, 
            p.first_name || ' ' || p.last_name as patient_name,
            p.mrn_number,
            o.opd_id
        FROM patients p
        JOIN opd_entries o ON p.patient_id = o.patient_id
        WHERE o.branch_id = 55
        LIMIT 15
    LOOP
        -- Insert varied feedback for each patient
        
        -- Positive feedback (rating 4-5)
        IF feedback_count % 3 = 0 THEN
            INSERT INTO patient_feedback (
                patient_id, patient_name, mrn, service_context, rating, 
                tags, comment, sentiment, nurse_id, branch_id, opd_id,
                is_addressed, created_at
            ) VALUES (
                patient_rec.patient_id,
                patient_rec.patient_name,
                patient_rec.mrn_number,
                'Post Consultation',
                4 + (random() * 1)::int,
                '["Doctor Care", "Nursing Staff"]',
                CASE (random() * 4)::int
                    WHEN 0 THEN 'The doctor was very thorough and explained everything clearly. The nursing staff was also very helpful.'
                    WHEN 1 THEN 'Excellent care! The nurses were attentive and made me feel comfortable throughout my visit.'
                    WHEN 2 THEN 'Very professional service. Dr. explained my condition and treatment options in detail.'
                    WHEN 3 THEN 'I am very satisfied with the care I received. The staff was friendly and efficient.'
                    ELSE 'Great experience overall. Would definitely recommend this hospital to others.'
                END,
                'Positive',
                user_id_var,
                55,
                patient_rec.opd_id,
                (random() > 0.5),
                NOW() - (random() * 30)::int * INTERVAL '1 day'
            );
        
        -- Neutral feedback (rating 3)
        ELSIF feedback_count % 3 = 1 THEN
            INSERT INTO patient_feedback (
                patient_id, patient_name, mrn, service_context, rating, 
                tags, comment, sentiment, nurse_id, branch_id, opd_id,
                is_addressed, created_at
            ) VALUES (
                patient_rec.patient_id,
                patient_rec.patient_name,
                patient_rec.mrn_number,
                'Post Treatment',
                3,
                '["Wait Time", "Facilities"]',
                CASE (random() * 3)::int
                    WHEN 0 THEN 'The wait time was a bit long, but the treatment was good once I saw the doctor.'
                    WHEN 1 THEN 'Average experience. The facilities could be better maintained.'
                    WHEN 2 THEN 'Okay service. Had to wait longer than expected but staff was polite.'
                    ELSE 'Nothing special to mention. Standard hospital visit.'
                END,
                'Neutral',
                user_id_var,
                55,
                patient_rec.opd_id,
                false,
                NOW() - (random() * 30)::int * INTERVAL '1 day'
            );
        
        -- Negative feedback (rating 1-2)
        ELSE
            INSERT INTO patient_feedback (
                patient_id, patient_name, mrn, service_context, rating, 
                tags, comment, sentiment, nurse_id, branch_id, opd_id,
                is_addressed, follow_up_notes, addressed_at, addressed_by,
                created_at
            ) VALUES (
                patient_rec.patient_id,
                patient_rec.patient_name,
                patient_rec.mrn_number,
                'Post Consultation',
                1 + (random() * 1)::int,
                '["Wait Time", "Billing", "Communication"]',
                CASE (random() * 3)::int
                    WHEN 0 THEN 'Very long wait time and the billing process was confusing. Need improvement.'
                    WHEN 1 THEN 'Not happy with the communication. Felt rushed during consultation.'
                    WHEN 2 THEN 'The waiting area was crowded and uncomfortable. Staff seemed overwhelmed.'
                    ELSE 'Billing issues took too long to resolve. Better communication needed.'
                END,
                'Negative',
                user_id_var,
                55,
                patient_rec.opd_id,
                true,
                'Spoke with patient and apologized for the inconvenience. Escalated to management for process improvement.',
                NOW() - (random() * 5)::int * INTERVAL '1 day',
                user_id_var,
                NOW() - (random() * 30)::int * INTERVAL '1 day'
            );
        END IF;
        
        feedback_count := feedback_count + 1;
    END LOOP;

    RAISE NOTICE 'Inserted % feedback records', feedback_count;
END $$;

-- Add some additional varied feedback spread over the past month
INSERT INTO patient_feedback (patient_name, mrn, service_context, rating, tags, comment, sentiment, nurse_id, branch_id, is_addressed, created_at)
SELECT 
    'Walk-in Patient ' || generate_series,
    'WLK' || LPAD(generate_series::text, 5, '0'),
    CASE WHEN random() > 0.5 THEN 'Post Consultation' ELSE 'Post Treatment' END,
    (1 + random() * 4)::int,
    CASE (random() * 4)::int
        WHEN 0 THEN '["Doctor Care"]'
        WHEN 1 THEN '["Nursing Staff", "Cleanliness"]'
        WHEN 2 THEN '["Wait Time"]'
        WHEN 3 THEN '["Billing", "Communication"]'
        ELSE '["Facilities"]'
    END,
    CASE (random() * 7)::int
        WHEN 0 THEN 'Very satisfied with the service. Will come back again.'
        WHEN 1 THEN 'Good experience. The doctor was knowledgeable and caring.'
        WHEN 2 THEN 'Average service. Nothing exceptional but okay.'
        WHEN 3 THEN 'Long waiting time but good treatment.'
        WHEN 4 THEN 'Staff was helpful and courteous.'
        WHEN 5 THEN 'Could improve the waiting area facilities.'
        WHEN 6 THEN 'Quick and efficient service. Very happy!'
        ELSE 'Decent experience. Would recommend to others.'
    END,
    CASE 
        WHEN (1 + random() * 4)::int >= 4 THEN 'Positive'
        WHEN (1 + random() * 4)::int <= 2 THEN 'Negative'
        ELSE 'Neutral'
    END,
    1,
    55,
    (random() > 0.7),
    NOW() - (generate_series * 2) * INTERVAL '1 day'
FROM generate_series(1, 10);

-- Show summary
SELECT 
    'Feedback Summary' as info,
    COUNT(*) as total,
    COUNT(*) FILTER (WHERE sentiment = 'Positive') as positive,
    COUNT(*) FILTER (WHERE sentiment = 'Neutral') as neutral,
    COUNT(*) FILTER (WHERE sentiment = 'Negative') as negative,
    COUNT(*) FILTER (WHERE is_addressed = true) as addressed,
    ROUND(AVG(rating)::numeric, 1) as avg_rating
FROM patient_feedback
WHERE branch_id = 55;
