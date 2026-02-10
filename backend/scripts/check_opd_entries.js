const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOpd() {
    try {
        const res = await pool.query('SELECT * FROM opd_entries ORDER BY created_at DESC LIMIT 5');
        console.log('Count:', res.rowCount);
        console.log('Entries:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkOpd();
