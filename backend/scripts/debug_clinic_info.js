const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function dumpInfo() {
    try {
        const hospitals = await pool.query(`SELECT * FROM hospitals`);
        console.log('Hospitals:', JSON.stringify(hospitals.rows, null, 2));

        const branches = await pool.query(`SELECT * FROM branches`);
        console.log('Branches:', JSON.stringify(branches.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
dumpInfo();
