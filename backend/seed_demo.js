const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'hms_database'
};

async function seedDemoData() {
    console.log('Starting demo data seeding...');
    const client = new Client(dbConfig);

    try {
        await client.connect();
        
        // Helper to hash password
        const hashPassword = async (pwd) => {
            const salt = await bcrypt.genSalt(10);
            return await bcrypt.hash(pwd, salt);
        };

        const defaultPasswordHash = await hashPassword('Password123!');
        console.log('Default password hash generated for "Password123!"');

        // 1. Departments (from seed_departments.sql logic)
        console.log('Seeding Departments...');
        const departments = [
            ['Cardiology', 'CARD', 'Heart care'],
            ['General Medicine', 'GENM', 'General health'],
            ['Pediatrics', 'PEDI', 'Child care'],
            ['Orthopedics', 'ORTH', 'Bone care'],
            ['Emergency', 'EMER', 'Emergency care']
        ];

        for (const [name, code, desc] of departments) {
            await client.query(
                `INSERT INTO departments (department_name, department_code, description) 
                 VALUES ($1, $2, $3) ON CONFLICT (department_code) DO NOTHING`,
                [name, code, desc]
            );
        }

        // 2. Hospital
        console.log('Seeding Hospital...');
        const hospResult = await client.query(
            `INSERT INTO hospitals (hospital_name, hospital_code, hospital_type, email, contact_number)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (hospital_code) DO UPDATE SET hospital_name = EXCLUDED.hospital_name
             RETURNING hospital_id`,
            ['City Care Hospital', 'CCH01', 'Private', 'info@citycare.com', '9876543210']
        );
        const hospitalId = hospResult.rows[0].hospital_id;

        // 3. Branch
        console.log('Seeding Branch...');
        const branchResult = await client.query(
            `INSERT INTO branches (hospital_id, branch_name, branch_code, city, contact_number)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (hospital_id, branch_code) DO UPDATE SET branch_name = EXCLUDED.branch_name
             RETURNING branch_id`,
            [hospitalId, 'Main Branch', 'MAIN', 'New York', '9876543211']
        );
        const branchId = branchResult.rows[0].branch_id;

        // 4. Branch Departments
        console.log('Mapping Departments to Branch...');
        const deptRows = await client.query('SELECT department_id FROM departments');
        for (const row of deptRows.rows) {
            await client.query(
                `INSERT INTO branch_departments (branch_id, department_id)
                 VALUES ($1, $2) ON CONFLICT (branch_id, department_id) DO NOTHING`,
                [branchId, row.department_id]
            );
        }

        // Helper to create user
        const createUser = async (username, email, roleCode, phone) => {
            // Get role ID
            const roleRes = await client.query('SELECT role_id FROM roles WHERE role_code = $1', [roleCode]);
            if (roleRes.rows.length === 0) return null;
            const roleId = roleRes.rows[0].role_id;

            const userRes = await client.query(
                `INSERT INTO users (username, email, password_hash, role_id, phone_number, is_active, is_email_verified)
                 VALUES ($1, $2, $3, $4, $5, true, true)
                 ON CONFLICT (email) DO UPDATE SET password_hash = $3
                 RETURNING user_id`,
                [username, email, defaultPasswordHash, roleId, phone]
            );
            return userRes.rows[0].user_id;
        };

        // 5. Users & Profiles

        // Client Admin
        console.log('Seeding Client Admin...');
        const clientAdminId = await createUser('clientadmin', 'admin@citycare.com', 'CLIENT_ADMIN', '9999999999');
        // Note: Client Admin usually doesn't have a profile table in this schema, just a user linked to hospital/branch?
        // Wait, schema doesn't show client_admins table. Usually they are just Users with a role.
        // But they might need to be linked to a hospital.
        // There is no `user_hospitals` table. Maybe `staff` table?
        // Let's assume Client Admin is just a user for now, or maybe Staff.

        // Doctor
        console.log('Seeding Doctor...');
        const docUserId = await createUser('dr.smith', 'smith@citycare.com', 'DOCTOR', '8888888888');
        if (docUserId) {
            const docRes = await client.query(
                `INSERT INTO doctors (user_id, first_name, last_name, doctor_code, qualification, specialization, registration_number, consultation_fee)
                 VALUES ($1, 'John', 'Smith', 'DOC001', 'MBBS, MD', 'Cardiology', 'REG12345', 500.00)
                 ON CONFLICT (doctor_code) DO NOTHING
                 RETURNING doctor_id`,
                [docUserId]
            );
            if (docRes.rows.length > 0) {
                const docId = docRes.rows[0].doctor_id;
                // Assign to Branch
                await client.query(
                    `INSERT INTO doctor_branches (doctor_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [docId, branchId]
                );
            }
        }

        // Nurse
        console.log('Seeding Nurse...');
        const nurseUserId = await createUser('nurse.jane', 'jane@citycare.com', 'NURSE', '7777777777');
        if (nurseUserId) {
            const nurseRes = await client.query(
                `INSERT INTO nurses (user_id, first_name, last_name, nurse_code, qualification, experience_years, registration_number)
                 VALUES ($1, 'Jane', 'Doe', 'NUR001', 'B.Sc Nursing', 5, 'NREG98765')
                 ON CONFLICT (nurse_code) DO NOTHING
                 RETURNING nurse_id`,
                [nurseUserId]
            );
            if (nurseRes.rows.length > 0) {
                const nurseId = nurseRes.rows[0].nurse_id;
                // Assign to Branch
                await client.query(
                    `INSERT INTO nurse_branches (nurse_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [nurseId, branchId]
                );
            }
        }

        // Receptionist
        console.log('Seeding Receptionist...');
        const recepUserId = await createUser('recep.sarah', 'sarah@citycare.com', 'RECEPTIONIST', '6666666666');
        if (recepUserId) {
            const staffRes = await client.query(
                `INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type)
                 VALUES ($1, 'Sarah', 'Connor', 'STF001', 'Receptionist')
                 ON CONFLICT (staff_code) DO NOTHING
                 RETURNING staff_id`,
                [recepUserId]
            );
            if (staffRes.rows.length > 0) {
                const staffId = staffRes.rows[0].staff_id;
                // Assign to Branch
                await client.query(
                    `INSERT INTO staff_branches (staff_id, branch_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [staffId, branchId]
                );
            }
        }

        // Patient
        console.log('Seeding Patient...');
        const patientRes = await client.query(
            `INSERT INTO patients (first_name, last_name, mrn_number, patient_code, gender, date_of_birth, contact_number, email)
             VALUES ('Alice', 'Wonderland', 'MRN001', 'PAT001', 'Female', '1990-01-01', '5555555555', 'alice@example.com')
             ON CONFLICT (mrn_number) DO NOTHING
             RETURNING patient_id`,
        );
        
        console.log('Demo data seeded successfully!');

    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seedDemoData();
