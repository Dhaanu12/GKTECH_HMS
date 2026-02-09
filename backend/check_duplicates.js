const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkDuplicates() {
    try {
        const res = await pool.query(`
            SELECT approval_no, COUNT(*) 
            FROM insurance_claims 
            WHERE approval_no IS NOT NULL AND approval_no != '' 
            GROUP BY approval_no 
            HAVING COUNT(*) > 1
        `);
        console.log('Duplicate Approval Numbers:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkDuplicates();
