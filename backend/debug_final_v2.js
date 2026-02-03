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
        const hospitalId = 40; // Known from previous step

        console.log(`\n--- 1. Check Branches for Hospital ${hospitalId} ---`);
        const branches = await pool.query("SELECT branch_id, branch_name, is_active FROM branches WHERE hospital_id = $1", [hospitalId]);
        console.table(branches.rows);

        console.log('\n--- 2. Search User "Satish" ---');
        const users = await pool.query(`
            SELECT user_id, username, role_id, hospital_id, branch_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%'
        `);
        console.table(users.rows);

        if (users.rows.length === 0) {
            console.log("Satish user not found.");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
