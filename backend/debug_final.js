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
        console.log('--- 1. Search Hospital "Nano" ---');
        const hosp = await pool.query("SELECT hospital_id, hospital_name, is_active FROM hospitals WHERE hospital_name ILIKE '%Nano%'");
        console.table(hosp.rows);

        let hospitalId = null;
        if (hosp.rows.length > 0) {
            hospitalId = hosp.rows[0].hospital_id;

            console.log(`\n--- 2. Check Branches for Hospital ${hospitalId} ---`);
            const branches = await pool.query("SELECT * FROM branches WHERE hospital_id = $1", [hospitalId]);
            console.table(branches.rows);
        }

        console.log('\n--- 3. Search User "Satish" ---');
        const users = await pool.query(`
            SELECT user_id, username, role_code, hospital_id, branch_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%'
        `);
        console.table(users.rows);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
