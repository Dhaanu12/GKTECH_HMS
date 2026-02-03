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
        console.log('--- Checking All Hospital Services ---');
        const res = await pool.query("SELECT * FROM hospital_services LIMIT 5");
        console.log('Sample rows from hospital_services:', JSON.stringify(res.rows, null, 2));

        console.log('--- Checking All Services ---');
        const sRes = await pool.query("SELECT * FROM services LIMIT 5");
        console.log('Sample rows from services:', JSON.stringify(sRes.rows, null, 2));

        console.log('--- Checking Join Query (Sample Hospital ID) ---');
        // Let's pick a hospital ID from the first result if available
        if (res.rows.length > 0) {
            const hospitalId = res.rows[0].hospital_id;
            console.log(`Testing for Hospital ID: ${hospitalId}`);

            const joinRes = await pool.query(
                `SELECT s.service_name, hs.service_code, s.is_active
                 FROM hospital_services hs 
                 JOIN services s ON hs.service_code = s.service_code 
                 WHERE hs.hospital_id = $1`,
                [hospitalId]
            );
            console.log(`Found ${joinRes.rows.length} joined services.`);
            console.log(JSON.stringify(joinRes.rows, null, 2));
        } else {
            console.log('No data in hospital_services table!');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
