const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function debug() {
    try {
        console.log('Connecting to DB...');

        // 1. Check table schema for referral_doctor_module
        console.log('Checking referral_doctor_module schema...');
        const schemaRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'referral_doctor_module'
        `);
        // console.log('Columns:', schemaRes.rows.map(r => r.column_name)); // Condensed

        // 2. Check referral_patients data
        console.log('Checking referral_patients data...');
        const patients = await pool.query('SELECT id, patient_name, marketing_spoc, created_by FROM referral_patients LIMIT 5');
        console.log('Sample Patients:', patients.rows);

        // 3. Check referral_agents data
        console.log('Checking referral_agents data...');
        const agents = await pool.query('SELECT id, name, created_by, status FROM referral_agents LIMIT 5');
        console.log('Sample Agents:', agents.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debug();
