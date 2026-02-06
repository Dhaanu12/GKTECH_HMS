const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function listBranches() {
    try {
        const res = await pool.query(`SELECT * FROM branches`);
        console.log('Branches:', res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
listBranches();
