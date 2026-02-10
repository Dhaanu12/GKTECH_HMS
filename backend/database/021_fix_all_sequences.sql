-- Fix sequences for all tables to ensure they are consistent with the current max ID

-- 1. Roles
SELECT setval('roles_role_id_seq', COALESCE((SELECT MAX(role_id) FROM roles), 1));

-- 2. Hospitals
SELECT setval('hospitals_hospital_id_seq', COALESCE((SELECT MAX(hospital_id) FROM hospitals), 1));

-- 3. Users
SELECT setval('users_user_id_seq', COALESCE((SELECT MAX(user_id) FROM users), 1));

-- 4. Branches
SELECT setval('branches_branch_id_seq', COALESCE((SELECT MAX(branch_id) FROM branches), 1));

-- 5. Departments
SELECT setval('departments_department_id_seq', COALESCE((SELECT MAX(department_id) FROM departments), 1));

-- 6. Branch Departments
SELECT setval('branch_departments_hospital_dept_id_seq', COALESCE((SELECT MAX(hospital_dept_id) FROM branch_departments), 1));

-- 7. Staff
SELECT setval('staff_staff_id_seq', COALESCE((SELECT MAX(staff_id) FROM staff), 1));

-- 8. Doctors
SELECT setval('doctors_doctor_id_seq', COALESCE((SELECT MAX(doctor_id) FROM doctors), 1));

-- 9. Nurses
SELECT setval('nurses_nurse_id_seq', COALESCE((SELECT MAX(nurse_id) FROM nurses), 1));

-- 10. Staff Branches
SELECT setval('staff_branches_staff_hospital_id_seq', COALESCE((SELECT MAX(staff_hospital_id) FROM staff_branches), 1));

-- 11. Doctor Branches
SELECT setval('doctor_branches_doc_hospital_id_seq', COALESCE((SELECT MAX(doc_hospital_id) FROM doctor_branches), 1));

-- 12. Doctor Departments
SELECT setval('doctor_departments_doc_dept_id_seq', COALESCE((SELECT MAX(doc_dept_id) FROM doctor_departments), 1));

-- 13. Doctor Branch Departments
SELECT setval('doctor_branch_departments_doc_hosp_dept_id_seq', COALESCE((SELECT MAX(doc_hosp_dept_id) FROM doctor_branch_departments), 1));

-- 14. Nurse Branches
SELECT setval('nurse_branches_nurse_hospital_id_seq', COALESCE((SELECT MAX(nurse_hospital_id) FROM nurse_branches), 1));

-- 15. Shifts
SELECT setval('shifts_shift_id_seq', COALESCE((SELECT MAX(shift_id) FROM shifts), 1));

-- 16. Shift Branches
SELECT setval('shift_branches_shift_hospital_id_seq', COALESCE((SELECT MAX(shift_hospital_id) FROM shift_branches), 1));

-- 17. Nurse Shifts
SELECT setval('nurse_shifts_nurse_shift_id_seq', COALESCE((SELECT MAX(nurse_shift_id) FROM nurse_shifts), 1));

-- 18. Doctor Shifts
SELECT setval('doctor_shifts_doctor_shift_id_seq', COALESCE((SELECT MAX(doctor_shift_id) FROM doctor_shifts), 1));

-- 19. Patients
SELECT setval('patients_patient_id_seq', COALESCE((SELECT MAX(patient_id) FROM patients), 1));

-- 20. Appointments
SELECT setval('appointments_appointment_id_seq', COALESCE((SELECT MAX(appointment_id) FROM appointments), 1));

-- 21. OPD Entries
SELECT setval('opd_entries_opd_id_seq', COALESCE((SELECT MAX(opd_id) FROM opd_entries), 1));

-- 22. Services
SELECT setval('services_service_id_seq', COALESCE((SELECT MAX(service_id) FROM services), 1));

-- 23. Billings
SELECT setval('billings_bill_id_seq', COALESCE((SELECT MAX(bill_id) FROM billings), 1));

-- 24. Billing Items
SELECT setval('billing_items_bill_item_id_seq', COALESCE((SELECT MAX(bill_item_id) FROM billing_items), 1));
