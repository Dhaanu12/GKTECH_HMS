const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkFee() {
    try {
        const res = await pool.query(`
            SELECT b.branch_name, b.mlc_fee, d.first_name, d.last_name
            FROM doctors d
            JOIN branches b ON d.branch_id = b.branch_id
            WHERE d.doctor_id = 39
        `);
        console.log('Verification Result:', res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkFee();
