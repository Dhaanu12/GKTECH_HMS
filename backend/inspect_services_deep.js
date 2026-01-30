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
        console.log('--- Inspecting Services Table for "lab" categories ---');

        // Check for any category containing 'lab'
        const catRes = await pool.query("SELECT DISTINCT service_category FROM services WHERE service_category ILIKE '%lab%'");
        console.log('Categories matching "lab":', catRes.rows);

        // Check for any service_type containing 'lab' if the column exists
        try {
            const typeRes = await pool.query("SELECT DISTINCT service_type FROM services WHERE service_type ILIKE '%lab%'");
            console.log('Types matching "lab":', typeRes.rows);
        } catch (e) {
            console.log("Column service_type might not exist.");
        }

        // Just dump first 5 rows to see structure again
        const rows = await pool.query("SELECT * FROM services LIMIT 5");
        console.log('First 5 rows:', rows.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
