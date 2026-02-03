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
        console.log('--- 1. Searching for Hospital "Nano" ---');
        // Try hospital_name
        let hospitalId = null;
        let tenantId = null;
        try {
            const hosp = await pool.query("SELECT id, hospital_name, uuid, created_at FROM hospitals WHERE hospital_name ILIKE '%Nano%'");
            if (hosp.rows.length > 0) {
                console.table(hosp.rows);
                hospitalId = hosp.rows[0].id; // PK
                // If there's a UUID/Tenant ID logic
            } else {
                console.log('No hospital found with name like Nano');
            }
        } catch (e) { console.log('Error querying hospitals:', e.message); }

        console.log('\n--- 2. Searching for User "Satish" ---');
        const users = await pool.query(`
            SELECT id, username, email, role_code, hospital_id, branch_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%' OR email ILIKE '%Satish%'
        `);
        if (users.rows.length > 0) console.table(users.rows);
        else console.log('No user found matching Satish');

        console.log('\n--- 3. Searching for Referral Doctor "Satish" ---');
        try {
            const refDocs = await pool.query(`
                SELECT id, doctor_name, tenant_id, hospital_id 
                FROM referral_doctor_module 
                WHERE doctor_name ILIKE '%Satish%'
            `);
            if (refDocs.rows.length > 0) console.table(refDocs.rows);
            else console.log('No referral doctor found matching Satish');
        } catch (e) { console.log('Error querying referral_doctor_module:', e.message); }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
