-- Seed Lab Orders Data
-- This script adds sample lab orders for testing

-- Clear existing lab orders (optional - comment out if you want to keep existing data)
-- DELETE FROM lab_order_status_history;
-- DELETE FROM lab_orders;

-- Insert Lab Orders with various statuses and priorities
INSERT INTO lab_orders (
    order_number, patient_id, doctor_id, branch_id, test_name, test_code, 
    test_category, priority, status, ordered_at, scheduled_for, 
    instructions, notes, assigned_nurse_id, result_summary, completed_at
) VALUES 
-- STAT Priority Orders (Critical)
('LAB-2026-001', 1, 4, 1, 'Complete Blood Count (CBC)', 'CBC001', 
 'Lab', 'STAT', 'Ordered', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '30 minutes',
 'Fasting required. Patient should not eat for 8 hours before test.', 
 'Patient has history of anemia', NULL, NULL, NULL),

('LAB-2026-002', 3, 6, 1, 'Arterial Blood Gas (ABG)', 'ABG001', 
 'Lab', 'STAT', 'In-Progress', NOW() - INTERVAL '2 hours', NOW(),
 'Handle with care. Immediately place on ice.', 
 'ICU patient - critical', 4, NULL, NULL),

-- Urgent Priority Orders
('LAB-2026-003', 2, 5, 1, 'Lipid Profile', 'LIP001', 
 'Lab', 'Urgent', 'Ordered', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '1 hour',
 '12-hour fasting required', 
 'Follow-up for cholesterol management', NULL, NULL, NULL),

('LAB-2026-004', 4, 7, 1, 'Liver Function Test (LFT)', 'LFT001', 
 'Lab', 'Urgent', 'In-Progress', NOW() - INTERVAL '4 hours', NOW() - INTERVAL '30 minutes',
 'No alcohol 24 hours before test', 
 'Suspected hepatitis', 5, NULL, NULL),

('LAB-2026-005', 5, 8, 1, 'Chest X-Ray', 'CXR001', 
 'Imaging', 'Urgent', 'Ordered', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours',
 'Remove all metal objects. PA and lateral views required.', 
 'Rule out pneumonia', NULL, NULL, NULL),

-- Routine Priority Orders
('LAB-2026-006', 1, 4, 1, 'HbA1c (Glycated Hemoglobin)', 'HBA1C001', 
 'Lab', 'Routine', 'Ordered', NOW() - INTERVAL '6 hours', NOW() + INTERVAL '4 hours',
 'No fasting required', 
 'Diabetes monitoring', NULL, NULL, NULL),

('LAB-2026-007', 2, 5, 1, 'Thyroid Panel (T3, T4, TSH)', 'THY001', 
 'Lab', 'Routine', 'In-Progress', NOW() - INTERVAL '5 hours', NOW() + INTERVAL '1 hour',
 'Morning sample preferred', 
 'Annual thyroid check', 3, NULL, NULL),

('LAB-2026-008', 3, 6, 1, 'Urine Routine Examination', 'URE001', 
 'Lab', 'Routine', 'Ordered', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '3 hours',
 'Mid-stream clean catch sample required', 
 'Suspected UTI', NULL, NULL, NULL),

('LAB-2026-009', 4, 7, 1, 'Ultrasound Abdomen', 'USG001', 
 'Imaging', 'Routine', 'Ordered', NOW() - INTERVAL '8 hours', NOW() + INTERVAL '5 hours',
 'Patient should drink 4-5 glasses of water 1 hour before. Full bladder required.', 
 'Abdominal pain evaluation', NULL, NULL, NULL),

('LAB-2026-010', 5, 8, 1, 'ECG (12-Lead)', 'ECG001', 
 'Procedure', 'Routine', 'In-Progress', NOW() - INTERVAL '3 hours', NOW(),
 'Patient should rest for 10 minutes before procedure', 
 'Pre-operative assessment', 4, NULL, NULL),

-- Completed Orders
('LAB-2026-011', 1, 4, 1, 'Blood Glucose Fasting', 'BGF001', 
 'Lab', 'Routine', 'Completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours',
 'Minimum 8 hours fasting required', 
 'Diabetes screening', 5, 
 'Fasting Blood Glucose: 98 mg/dL (Normal Range: 70-100 mg/dL). Result within normal limits.',
 NOW() - INTERVAL '18 hours'),

('LAB-2026-012', 2, 5, 1, 'Complete Blood Count (CBC)', 'CBC002', 
 'Lab', 'Urgent', 'Completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '44 hours',
 'No special preparation needed', 
 'Pre-surgery workup', 3,
 'WBC: 7,500/µL (Normal), RBC: 4.8 M/µL (Normal), Hemoglobin: 14.2 g/dL (Normal), Platelets: 250,000/µL (Normal). All values within normal range. Patient cleared for surgery.',
 NOW() - INTERVAL '42 hours'),

('LAB-2026-013', 3, 6, 1, 'Kidney Function Test (KFT)', 'KFT001', 
 'Lab', 'STAT', 'Completed', NOW() - INTERVAL '12 hours', NOW() - INTERVAL '10 hours',
 'Patient should be well hydrated', 
 'Acute kidney injury monitoring', 4,
 'Serum Creatinine: 1.8 mg/dL (Elevated), BUN: 28 mg/dL (Slightly elevated), eGFR: 52 mL/min (Stage 3 CKD). Recommend nephrology consultation and repeat in 48 hours.',
 NOW() - INTERVAL '8 hours'),

('LAB-2026-014', 4, 7, 1, 'Chest X-Ray', 'CXR002', 
 'Imaging', 'Routine', 'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '70 hours',
 'PA and lateral views', 
 'Annual checkup', 5,
 'Heart size normal. Lung fields clear. No active pulmonary disease. Costophrenic angles sharp. No pleural effusion. Impression: Normal chest X-ray.',
 NOW() - INTERVAL '68 hours'),

-- Cancelled Order
('LAB-2026-015', 5, 8, 1, 'MRI Brain', 'MRI001', 
 'Imaging', 'Routine', 'Cancelled', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours',
 'Remove all metal implants. Claustrophobic patients may need sedation.', 
 'Headache evaluation - cancelled as patient improved', NULL, NULL, NULL);

-- Add status history for in-progress and completed orders
INSERT INTO lab_order_status_history (order_id, previous_status, new_status, changed_by, notes) 
SELECT order_id, NULL, 'Ordered', 1, 'Order created'
FROM lab_orders WHERE order_number LIKE 'LAB-2026-%';

INSERT INTO lab_order_status_history (order_id, previous_status, new_status, changed_by, notes)
SELECT order_id, 'Ordered', 'In-Progress', 1, 'Sample collection started'
FROM lab_orders WHERE status = 'In-Progress' AND order_number LIKE 'LAB-2026-%';

INSERT INTO lab_order_status_history (order_id, previous_status, new_status, changed_by, notes)
SELECT order_id, 'Ordered', 'In-Progress', 1, 'Processing started'
FROM lab_orders WHERE status = 'Completed' AND order_number LIKE 'LAB-2026-%';

INSERT INTO lab_order_status_history (order_id, previous_status, new_status, changed_by, notes)
SELECT order_id, 'In-Progress', 'Completed', 1, 'Results uploaded'
FROM lab_orders WHERE status = 'Completed' AND order_number LIKE 'LAB-2026-%';

INSERT INTO lab_order_status_history (order_id, previous_status, new_status, changed_by, notes)
SELECT order_id, 'Ordered', 'Cancelled', 1, 'Cancelled by doctor - patient condition improved'
FROM lab_orders WHERE status = 'Cancelled' AND order_number LIKE 'LAB-2026-%';

-- Verify the data
SELECT 
    lo.order_number, 
    lo.test_name, 
    lo.priority, 
    lo.status,
    p.first_name || ' ' || p.last_name AS patient,
    d.first_name || ' ' || d.last_name AS doctor,
    n.first_name || ' ' || n.last_name AS nurse
FROM lab_orders lo
JOIN patients p ON lo.patient_id = p.patient_id
JOIN doctors d ON lo.doctor_id = d.doctor_id
LEFT JOIN nurses n ON lo.assigned_nurse_id = n.nurse_id
WHERE lo.order_number LIKE 'LAB-2026-%'
ORDER BY 
    CASE lo.priority WHEN 'STAT' THEN 1 WHEN 'Urgent' THEN 2 ELSE 3 END,
    lo.ordered_at DESC;
