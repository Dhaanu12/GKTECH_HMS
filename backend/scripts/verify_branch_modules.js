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

async function runBranchModuleTest() {
    console.log('Starting Branch Module Verification...');

    try {
        // 1. Setup Data directly in DB to ensure clear state
        const client = await pool.connect();

        const timestamp = Date.now();
        const hospName = `BranchTest Hosp ${timestamp}`;
        const hospModules = [
            { id: 'doc', is_active: true },
            { id: 'nurse', is_active: true }
        ];

        // Create Hospital with Doc + Nurse
        const hRes = await client.query(`
            INSERT INTO hospitals (hospital_name, hospital_code, enabled_modules, is_active)
            VALUES ($1, $2, $3, true) RETURNING hospital_id
        `, [hospName, 'BTH' + timestamp, JSON.stringify(hospModules)]);
        const hospitalId = hRes.rows[0].hospital_id;
        console.log(`1. Created Hospital ${hospitalId} with Doc + Nurse enabled.`);

        // Create Branch with ONLY Doctor (Nurse not included)
        // This simulates restricting the branch to a subset.
        const branchModules = [
            { id: 'doc', is_active: true }
        ];
        const bRes = await client.query(`
             INSERT INTO branches (hospital_id, branch_name, branch_code, is_active, enabled_modules)
             VALUES ($1, 'Branch Doc Only', $2, true, $3) RETURNING branch_id
        `, [hospitalId, 'BDO' + timestamp, JSON.stringify(branchModules)]);
        const branchId = bRes.rows[0].branch_id;
        console.log(`2. Created Branch ${branchId} with ONLY Doctor enabled.`);

        // Create Users
        const { PasswordUtils } = require('../utils/authUtils');
        const hash = await PasswordUtils.hashPassword('Password123!');

        // Doctor User
        const docEmail = `b_doc_${timestamp}@test.com`;
        const dRole = (await client.query("SELECT role_id FROM roles WHERE role_code='DOCTOR'")).rows[0].role_id;
        const dUser = await client.query(`INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified) VALUES ($1, $2, $3, $4, true, true) RETURNING user_id`, [`b_doc_${timestamp}`, docEmail, hash, dRole]);
        const docId = dUser.rows[0].user_id;
        await client.query(`INSERT INTO doctors (user_id, first_name, last_name, doctor_code, registration_number) VALUES ($1, 'Branch', 'Doc', $2, $3)`, [docId, 'BD' + timestamp, 'BDR' + timestamp]);
        const dId = (await client.query(`SELECT doctor_id FROM doctors WHERE user_id=$1`, [docId])).rows[0].doctor_id;
        await client.query(`INSERT INTO doctor_branches (doctor_id, branch_id) VALUES ($1, $2)`, [dId, branchId]);

        // Nurse User
        const nurEmail = `b_nur_${timestamp}@test.com`;
        const nRole = (await client.query("SELECT role_id FROM roles WHERE role_code='NURSE'")).rows[0].role_id;
        const nUser = await client.query(`INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified) VALUES ($1, $2, $3, $4, true, true) RETURNING user_id`, [`b_nur_${timestamp}`, nurEmail, hash, nRole]);
        const nurseId = nUser.rows[0].user_id;
        await client.query(`INSERT INTO nurses (user_id, first_name, last_name, nurse_code, registration_number) VALUES ($1, 'Branch', 'Nurse', $2, $3)`, [nurseId, 'BN' + timestamp, 'BNR' + timestamp]);
        const nId = (await client.query(`SELECT nurse_id FROM nurses WHERE user_id=$1`, [nurseId])).rows[0].nurse_id;
        await client.query(`INSERT INTO nurse_branches (nurse_id, branch_id) VALUES ($1, $2)`, [nId, branchId]);

        client.release();
        console.log('   Users created and linked to Branch.');

        // Test Logins via direct AuthController (faster/cleaner than Axios if server is stale, but let's try Axios if possible to test full stack. Use AuthController direct since we know server is stale).
        const AuthController = require('../controllers/authController');

        const mockReq = (email) => ({
            body: { email, password: 'Password123!' },
            headers: { 'user-agent': 'Test' },
            ip: '127.0.0.1'
        });
        const mockRes = () => {
            const r = {};
            r.status = (c) => { r.statusCode = c; return r; };
            r.json = (d) => { r.data = d; return r; };
            return r;
        };

        // Test Doctor Login (Should Succeed)
        console.log('3. Testing Doctor Login (Expected: Success)...');
        const req1 = mockReq(docEmail);
        const res1 = mockRes();
        await AuthController.login(req1, res1, (err) => {
            if (err) console.error('❌ Doctor Login Error:', err.message, err.statusCode);
        });
        if (res1.data && res1.data.status === 'success') console.log('✅ Doctor Login Succeeded');
        else if (!res1.data) console.log('❓ (Doctor) No response data (Next called check above)');

        // Test Nurse Login (Should Fail - Branch Disabled)
        console.log('4. Testing Nurse Login (Expected: Fail 403)...');
        const req2 = mockReq(nurEmail);
        const res2 = mockRes();
        let nErr;
        await AuthController.login(req2, res2, (err) => { nErr = err; });
        if (nErr && nErr.statusCode === 403) {
            console.log('✅ Nurse Login Failed (403 Forbidden) as expected.');
            console.log('   Message:', nErr.message);
        } else {
            console.error('❌ Nurse Login Result Unexpected:', nErr ? nErr.message : 'Success');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await pool.end();
    }
}

runBranchModuleTest();
