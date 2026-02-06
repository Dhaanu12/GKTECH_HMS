const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' }); // Adjust path as needed

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkSequence() {
    try {
        console.log('Checking appointments max ID and sequence...');

        // 1. Get Max ID
        const maxIdRes = await pool.query('SELECT MAX(appointment_id) as max_id FROM appointments');
        const maxId = maxIdRes.rows[0].max_id || 0;
        console.log('Max appointment_id in table:', maxId);

        // 2. Get Sequence Name (usually appointments_appointment_id_seq)
        // We'll try the standard naming convention first.
        const seqName = 'appointments_appointment_id_seq';

        // 3. Get Current Sequence Value
        const seqRes = await pool.query(`SELECT last_value FROM ${seqName}`);
        const seqValue = seqRes.rows[0].last_value;
        console.log(`Current sequence value (${seqName}):`, seqValue);

        if (parseInt(seqValue) <= parseInt(maxId)) {
            console.log('ISSUE DETECTED: Sequence is <= Max ID. Needs reset.');
        } else {
            console.log('Sequence appears correct.');
        }

    } catch (error) {
        console.error('Error checking sequence:', error);
    } finally {
        await pool.end();
    }
}

checkSequence();
