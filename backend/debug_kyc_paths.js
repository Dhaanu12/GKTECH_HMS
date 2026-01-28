const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function checkPaths() {
    try {
        const res = await pool.query('SELECT id, doctor_name, kyc_upload_path FROM referral_doctor_module ORDER BY id DESC LIMIT 1;');
        console.log('Last Doctor Path:', res.rows[0]?.kyc_upload_path);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkPaths();
