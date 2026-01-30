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
        console.log('--- Checking Services Tables ---');

        // Check 'services' table
        try {
            const servicesCount = await pool.query('SELECT COUNT(*) FROM services');
            console.log(`Table 'services' count: ${servicesCount.rows[0].count}`);

            if (parseInt(servicesCount.rows[0].count) > 0) {
                const sample = await pool.query('SELECT * FROM services LIMIT 3');
                console.log('Sample from services:', sample.rows);
            }
        } catch (e) {
            console.log("Table 'services' error:", e.message);
        }

        // Check 'hospital_services' table
        try {
            const hServicesCount = await pool.query('SELECT COUNT(*) FROM hospital_services');
            console.log(`Table 'hospital_services' count: ${hServicesCount.rows[0].count}`);

            if (parseInt(hServicesCount.rows[0].count) > 0) {
                const sample = await pool.query('SELECT * FROM hospital_services LIMIT 3');
                console.log('Sample from hospital_services:', sample.rows);
            }
        } catch (e) {
            console.log("Table 'hospital_services' error:", e.message);
        }

    } catch (error) {
        console.error('General Error:', error);
    } finally {
        await pool.end();
    }
}

run();
