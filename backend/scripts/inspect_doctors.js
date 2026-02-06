const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspect() {
    try {
        const res = await pool.query(`SELECT * FROM doctors LIMIT 1`);
        console.log('Doctors columns:', Object.keys(res.rows[0]));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
inspect();
