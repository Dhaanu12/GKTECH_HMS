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
        console.log('--- Services Inspection ---');
        const s = await pool.query('SELECT * FROM services LIMIT 1');
        console.log('Services Columns:', Object.keys(s.rows[0]));
        console.log('Services Sample:', JSON.stringify(s.rows[0], null, 2));

        console.log('\n--- Hospital Services Inspection ---');
        const hs = await pool.query('SELECT * FROM hospital_services LIMIT 1');
        if (hs.rows.length > 0) {
            console.log('Hospital Services Columns:', Object.keys(hs.rows[0]));
            console.log('Hospital Services Sample:', JSON.stringify(hs.rows[0], null, 2));
        } else {
            console.log('Hospital Services is empty');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
