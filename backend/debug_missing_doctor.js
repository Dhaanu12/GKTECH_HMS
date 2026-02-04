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
        console.log('--- Searching for Hospital "Nano" ---');
        const hosp = await pool.query("SELECT * FROM hospitals WHERE name ILIKE '%Nano%'");
        console.table(hosp.rows);

        let hospitalId = null;
        if (hosp.rows.length > 0) {
            hospitalId = hosp.rows[0].id; // Assuming 'id' is the PK
            console.log(`Target Hospital ID: ${hospitalId}`);
        }

        console.log('\n--- Searching for Doctor "Satish" in Users ---');
        const users = await pool.query(`
            SELECT id, username, email, role_code, hospital_id, branch_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%' OR email ILIKE '%Satish%'
        `);
        console.table(users.rows);

        console.log('\n--- Searching for Doctor "Satish" in Employee/Staff/Doctor Tables ---');
        // Need to check schema for where doctors are stored if not just in users.
        // Assuming 'doctors' table or similar? Let's check 'users' with role 'DOCTOR' first.

        if (hospitalId) {
            console.log(`\n--- All Users in Hospital ${hospitalId} ---`);
            const hospUsers = await pool.query(`
                SELECT id, username, role_code, branch_id, is_active 
                FROM users 
                WHERE hospital_id = $1
             `, [hospitalId]);
            console.table(hospUsers.rows);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
