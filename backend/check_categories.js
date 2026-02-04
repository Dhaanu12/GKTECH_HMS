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
        console.log('--- Checking Service Categories ---');

        const res = await pool.query('SELECT DISTINCT service_category FROM services');
        console.log('Categories:', res.rows.map(r => r.service_category));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
