const { Pool } = require('pg');
const AuthController = require('../controllers/authController');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// Mock Express objects
const mockReq = (body, user) => ({
    body,
    user,
    headers: { 'user-agent': 'DebugScript' },
    ip: '127.0.0.1'
});
const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};
const mockNext = (err) => {
    if (err) throw err;
};

async function runDirectDebug() {
    console.log('Starting Direct Debug of AuthController...');
    const client = await pool.connect();

    try {
        // 1. Setup Data
        const modules = [
            { id: 'doc', is_active: true },
            { id: 'nurse', is_active: false }
        ];

        // Create Hospital
        const hRes = await client.query(`
            INSERT INTO hospitals (hospital_name, hospital_code, enabled_modules, is_active)
            VALUES ('Direct Debug Hosp', 'DDH', $1, true) RETURNING hospital_id
        `, [JSON.stringify(modules)]);
        const hospitalId = hRes.rows[0].hospital_id;

        // Create Branch
        const bRes = await client.query(`
             INSERT INTO branches (hospital_id, branch_name, branch_code, is_active)
             VALUES ($1, 'DD Branch', 'DDB', true) RETURNING branch_id
        `, [hospitalId]);
        const branchId = bRes.rows[0].branch_id;

        // Create Users
        const docEmail = 'dd_doc_' + Date.now() + '@test.com';
        const nurEmail = 'dd_nur_' + Date.now() + '@test.com';
        const pwd = 'Password123!';

        // Doc Role
        const dRole = (await client.query("SELECT role_id FROM roles WHERE role_code='DOCTOR'")).rows[0].role_id;
        const nRole = (await client.query("SELECT role_id FROM roles WHERE role_code='NURSE'")).rows[0].role_id;

        // Register users (using controller or direct insert? Direct insert to skip other logic)
        // Password hash mock or real? Real needed for login.
        // Let's use AuthController.register if possible? No, requires request.
        // Let's just insert with a known hash/logic or assume Login implementation calls DB.
        // Actually AuthController.login compares hash.
        // Let's simpler: Use AuthController.login but we need to exist in DB.
        // I'll reuse the previous script's ability to create users via API? No, API is stale.
        // I must insert into DB directly.
        // I need a hash.
        const { PasswordUtils } = require('../utils/authUtils');
        const hash = await PasswordUtils.hashPassword(pwd);

        const dUserRes = await client.query(`INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified) VALUES ($1, $2, $3, $4, true, true) RETURNING user_id`, ['dd_doc', docEmail, hash, dRole]);
        const docId = dUserRes.rows[0].user_id;

        const nUserRes = await client.query(`INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified) VALUES ($1, $2, $3, $4, true, true) RETURNING user_id`, ['dd_nurse', nurEmail, hash, nRole]);
        const nurseId = nUserRes.rows[0].user_id;

        // Link to Staff/Doctor/Nurse
        await client.query(`INSERT INTO doctors (user_id, first_name, last_name, doctor_code, registration_number) VALUES ($1, 'D', 'D', 'DC', 'REGD')`, [docId]);
        const docTblId = (await client.query(`SELECT doctor_id FROM doctors WHERE user_id=$1`, [docId])).rows[0].doctor_id;
        await client.query(`INSERT INTO doctor_branches (doctor_id, branch_id) VALUES ($1, $2)`, [docTblId, branchId]);

        await client.query(`INSERT INTO nurses (user_id, first_name, last_name, nurse_code, registration_number) VALUES ($1, 'N', 'N', 'NC', 'REGN')`, [nurseId]);
        const nurTblId = (await client.query(`SELECT nurse_id FROM nurses WHERE user_id=$1`, [nurseId])).rows[0].nurse_id;
        await client.query(`INSERT INTO nurse_branches (nurse_id, branch_id) VALUES ($1, $2)`, [nurTblId, branchId]);

        console.log('Setup Done. Testing Login Logic...');

        // Test 1: Doctor (Active)
        console.log('Test 1: Doctor Login (Should Success)');
        const req1 = mockReq({ email: docEmail, password: pwd });
        const res1 = mockRes();
        await AuthController.login(req1, res1, (err) => {
            if (err) console.error('❌ Doc Login Error Next:', err.message, err.statusCode);
        });
        if (res1.data && res1.data.status === 'success') console.log('✅ Doc Login Success');
        else if (!res1.data) console.log('❓ Doc Login yielded no response (next called?)');

        // Test 2: Nurse (Inactive)
        console.log('Test 2: Nurse Login (Should Fail 403)');
        const req2 = mockReq({ email: nurEmail, password: pwd });
        const res2 = mockRes();
        let nurseErr;
        await AuthController.login(req2, res2, (err) => { nurseErr = err; });
        if (nurseErr && nurseErr.statusCode === 403) console.log('✅ Nurse Login Failed correctly (403)');
        else console.error('❌ Nurse Login unexpected result:', nurseErr ? nurseErr.message : 'Success');

    } catch (e) {
        console.error('Direct Debug Failed:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

runDirectDebug();
