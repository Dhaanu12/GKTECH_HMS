const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function run() {
    try {
        console.log('--- 1. Get User Satish ---');
        const users = await pool.query(`
            SELECT user_id, username, role_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%'
        `);
        console.log('Users:', JSON.stringify(users.rows, null, 2));

        if (users.rows.length === 0) {
            console.log("No user found.");
            return;
        }

        const userId = users.rows[0].user_id;

        console.log(`\n--- 2. Check Doctors Table for User ${userId} ---`);
        const docs = await pool.query("SELECT * FROM doctors WHERE user_id = $1", [userId]);
        console.log('Doctors:', JSON.stringify(docs.rows, null, 2));

        if (docs.rows.length > 0) {
            const doctorId = docs.rows[0].doctor_id;
            console.log(`\n--- 3. Check Doctor Branches for Doctor ${doctorId} ---`);
            const docBranches = await pool.query("SELECT * FROM doctor_branches WHERE doctor_id = $1", [doctorId]);
            console.log('Doctor Branches:', JSON.stringify(docBranches.rows, null, 2));
        } else {
            console.log("User is NOT in doctors table.");
        }

        console.log('\n--- 4. Check Branches for Hospital 40 (Nano) ---');
        const branches = await pool.query("SELECT branch_id, branch_name FROM branches WHERE hospital_id = 40");
        console.log('Hospital Branches:', JSON.stringify(branches.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
