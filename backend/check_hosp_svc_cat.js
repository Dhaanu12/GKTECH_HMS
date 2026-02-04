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
        console.log('--- Inspecting Hospital Services Categories ---');

        const cols = await pool.query("SELECT * FROM hospital_services LIMIT 1");
        console.log("Columns:", Object.keys(cols.rows[0]));

        // Check if there's a category column
        if (cols.rows[0].hasOwnProperty('service_category') || cols.rows[0].hasOwnProperty('category')) {
            const colName = cols.rows[0].hasOwnProperty('service_category') ? 'service_category' : 'category';
            const cur = await pool.query(`SELECT DISTINCT ${colName} FROM hospital_services`);
            console.log(`Distinct ${colName}:`, cur.rows);
        } else {
            console.log("No category column found in hospital_services directly.");
            console.log("Maybe it's linked to the 'services' table via service_code or something?");
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
