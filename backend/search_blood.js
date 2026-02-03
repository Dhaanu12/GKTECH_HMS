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
        console.log('--- Searching for Blood ---');

        const res = await pool.query("SELECT * FROM services WHERE service_name ILIKE '%Blood%'");
        console.log(`Found ${res.rows.length} in services`);
        if (res.rows.length > 0) console.log(res.rows[0]);

        const res2 = await pool.query("SELECT * FROM hospital_services WHERE service_name ILIKE '%Blood%'");
        console.log(`Found ${res2.rows.length} in hospital_services`);
        if (res2.rows.length > 0) console.log(res2.rows[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
