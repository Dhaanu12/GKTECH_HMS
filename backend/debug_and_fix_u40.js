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
        const hospitalId = 40;
        console.log(`\n--- 1. Check Branches for Hospital ${hospitalId} ---`);
        const branches = await pool.query("SELECT branch_id, branch_name FROM branches WHERE hospital_id = $1", [hospitalId]);
        console.table(branches.rows);

        console.log('\n--- 2. Search User "Satish" ---');
        // 'role_id' is confirmed from users schema check
        const users = await pool.query(`
            SELECT user_id, username, role_id, hospital_id, branch_id, is_active 
            FROM users 
            WHERE username ILIKE '%Satish%'
        `);
        console.table(users.rows);

        if (users.rows.length === 0) {
            console.log("No user found with name Satish");
        } else {
            // Check if branch_id is null
            const user = users.rows[0];
            if (!user.branch_id) {
                console.log("ISSUE FOUND: User has NULL branch_id.");
                if (branches.rows.length > 0) {
                    const targetBranch = branches.rows[0].branch_id;
                    console.log(`Fixing... Assigning Branch ${targetBranch} to User ${user.user_id}`);
                    await pool.query("UPDATE users SET branch_id = $1 WHERE user_id = $2", [targetBranch, user.user_id]);
                    console.log("Fixed.");
                } else {
                    console.log("CRITICAL: Hospital has NO branches. Cannot assign branch_id.");
                }
            } else {
                console.log(`User has branch_id: ${user.branch_id}. Check if this branch matches the hospital's branch.`);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
