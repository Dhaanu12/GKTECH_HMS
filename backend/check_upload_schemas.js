const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function checkSchemas() {
    try {
        console.log('--- hospital_services ---');
        const hs = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'hospital_services'");
        console.log(hs.rows.length ? JSON.stringify(hs.rows, null, 2) : 'Table does not exist');

        console.log('--- referral_doctor_service_percentage_module ---');
        const rd = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'referral_doctor_service_percentage_module'");
        console.log(rd.rows.length ? JSON.stringify(rd.rows, null, 2) : 'Table does not exist');

        console.log('--- services ---');
        const s = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'services'");
        console.log(s.rows.length ? JSON.stringify(s.rows, null, 2) : 'Table does not exist');

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkSchemas();
