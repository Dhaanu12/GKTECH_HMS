const { Pool } = require('pg');
require('dotenv').config({ path: './.env' }); // Current directory for backend/.env

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkConstraint() {
    try {
        const query = `
            SELECT pg_get_constraintdef(oid) AS constraint_def
            FROM pg_constraint
            WHERE conname = 'opd_entries_visit_status_check';
        `;
        const res = await pool.query(query);
        console.log('Constraint Definition:');
        if (res.rows.length > 0) {
            console.log(res.rows[0].constraint_def);
        } else {
            console.log('Constraint not found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkConstraint();
