-- Fix users table sequence
SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users));

-- Also fix other sequences just in case
SELECT setval('hospitals_hospital_id_seq', (SELECT MAX(hospital_id) FROM hospitals));
SELECT setval('branches_branch_id_seq', (SELECT MAX(branch_id) FROM branches));
SELECT setval('staff_staff_id_seq', (SELECT MAX(staff_id) FROM staff));
SELECT setval('patients_patient_id_seq', (SELECT MAX(patient_id) FROM patients));
SELECT setval('appointments_appointment_id_seq', (SELECT MAX(appointment_id) FROM appointments));

