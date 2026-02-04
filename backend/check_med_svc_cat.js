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
        console.log('--- Checking Medical Services Categories ---');

        const catRes = await pool.query("SELECT DISTINCT category FROM medical_services");
        console.log('Categories:', catRes.rows.map(r => r.category));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
