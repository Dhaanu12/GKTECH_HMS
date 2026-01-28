const axios = require('axios');
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:5000/api';
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runRefinedTest() {
    console.log('Starting Refined Module Access Verification...');

    try {
        // 1. Login as Super Admin TO GET TOKEN
        console.log('1. Logging in as Super Admin...');
        const adminLogin = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@phchms.com',
            password: 'Admin123!'
        });
        const token = adminLogin.data.data.accessToken;
        console.log('   Super Admin logged in.');

        // 2. Create Hospital with Refined Structure
        // Doc: Active, Nurse: Inactive
        console.log('2. Creating Hospital (Doc: Active, Nurse: Inactive)...');
        const modules = [
            { id: 'doc', is_active: true },
            { id: 'nurse', is_active: false }
        ];

        const client = await pool.connect();
        let hospitalId, branchId;

        try {
            await client.query('BEGIN');

            const hospRes = await client.query(`
                INSERT INTO hospitals (hospital_name, hospital_code, enabled_modules, is_active)
                VALUES ($1, $2, $3, true) RETURNING *
            `, ['Refined Test Hospital', 'RTH' + Date.now(), JSON.stringify(modules)]);
            hospitalId = hospRes.rows[0].hospital_id;

            const branchRes = await client.query(`
                INSERT INTO branches (hospital_id, branch_name, branch_code, is_active)
                VALUES ($1, 'Refined Branch', $2, true) RETURNING *
            `, [hospitalId, 'RTB' + Date.now()]);
            branchId = branchRes.rows[0].branch_id;

            await client.query('COMMIT');
            console.log(`   Created Hospital ${hospitalId}`);
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

        // 3. Create Users
        console.log('3. Creating Users (Doc & Nurse)...');
        // Doctor
        const docEmail = 'doc' + Date.now() + '@test.com';
        const docPass = 'Password123!';
        const docRoleRes = await pool.query("SELECT role_id FROM roles WHERE role_code = 'DOCTOR'");
        const docRoleId = docRoleRes.rows[0].role_id;

        let res = await axios.post(`${API_URL}/auth/register`, {
            username: 'doc' + Date.now(), email: docEmail, password: docPass, phone_number: '1111111111', role_id: docRoleId
        });
        const docId = res.data.data.user.user_id;

        // Nurse
        const nurseEmail = 'nurse' + Date.now() + '@test.com';
        const nursePass = 'Password123!';
        const nurseRoleRes = await pool.query("SELECT role_id FROM roles WHERE role_code = 'NURSE'");
        const nurseRoleId = nurseRoleRes.rows[0].role_id;

        res = await axios.post(`${API_URL}/auth/register`, {
            username: 'nurse' + Date.now(), email: nurseEmail, password: nursePass, phone_number: '2222222222', role_id: nurseRoleId
        });
        const nurseId = res.data.data.user.user_id;

        // Link Users
        await pool.query(`INSERT INTO doctors (user_id, first_name, last_name, doctor_code, registration_number) VALUES ($1, 'Test', 'Doctor', $2, $3)`, [docId, 'D' + docId, 'REG' + docId]);
        const dRes = await pool.query('SELECT doctor_id FROM doctors WHERE user_id = $1', [docId]);
        await pool.query('INSERT INTO doctor_branches (doctor_id, branch_id) VALUES ($1, $2)', [dRes.rows[0].doctor_id, branchId]);

        await pool.query(`INSERT INTO nurses (user_id, first_name, last_name, nurse_code, registration_number) VALUES ($1, 'Test', 'Nurse', $2, $3)`, [nurseId, 'N' + nurseId, 'REG' + nurseId]);
        const nRes = await pool.query('SELECT nurse_id FROM nurses WHERE user_id = $1', [nurseId]);
        await pool.query('INSERT INTO nurse_branches (nurse_id, branch_id) VALUES ($1, $2)', [nRes.rows[0].nurse_id, branchId]);

        console.log('   Users created and linked.');

        // 4. Test DOCTOR Login (Should Succeed)
        console.log('4. Testing Doctor Login (Expected: Success)...');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: docEmail, password: docPass });
            console.log('✅ Doctor Login Succeeded');
        } catch (e) {
            console.error('❌ Doctor Login Failed:', e.response?.data?.message || e.message);
        }

        // 5. Test NURSE Login (Should Fail - Inactive)
        console.log('5. Testing Nurse Login (Expected: Fail - Inactive)...');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: nurseEmail, password: nursePass });
            console.error('❌ Nurse Login Succeeded (Should Fail)');
        } catch (e) {
            if (e.response?.status === 403) console.log('✅ Nurse Login Failed (403 Forbidden)');
            else console.error('❌ Nurse Login Failed with unexpected status:', e.response?.status || e.message);
        }

        // 6. Update Hospital: Activate Nurse, Unassign Doctor
        console.log('6. Updating Hospital (Nurse: Active, Doctor: Unassigned)...');
        const newModules = [
            { id: 'nurse', is_active: true }
        ];
        // Using direct DB update for speed/precision, verifying Controller logic via manual testing or assume similar logic
        // But let's verify Auth Controller logic primarily here.
        await pool.query('UPDATE hospitals SET enabled_modules = $1 WHERE hospital_id = $2', [JSON.stringify(newModules), hospitalId]);

        // 7. Test NURSE Login (Should Succeed)
        console.log('7. Testing Nurse Login (Expected: Success)...');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: nurseEmail, password: nursePass });
            console.log('✅ Nurse Login Succeeded');
        } catch (e) {
            console.error('❌ Nurse Login Failed:', e.response?.data?.message || e.message);
        }

        // 8. Test DOCTOR Login (Should Fail - Unassigned)
        console.log('8. Testing Doctor Login (Expected: Fail - Unassigned)...');
        try {
            await axios.post(`${API_URL}/auth/login`, { email: docEmail, password: docPass });
            console.error('❌ Doctor Login Succeeded (Should Fail)');
        } catch (e) {
            if (e.response?.status === 403) console.log('✅ Doctor Login Failed (403 Forbidden)');
            else console.error('❌ Doctor Login Failed with unexpected status:', e.response?.status || e.message);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        await pool.end();
    }
}

runRefinedTest();
