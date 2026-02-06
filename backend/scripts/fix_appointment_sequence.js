const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function fixSequence() {
    try {
        console.log('Fixing appointment sequence...');

        const seqName = 'appointments_appointment_id_seq';

        // 1. Get Max ID
        const maxIdRes = await pool.query('SELECT MAX(appointment_id) as max_id FROM appointments');
        const maxId = maxIdRes.rows[0].max_id || 0;
        console.log('Max appointment_id:', maxId);

        // 2. Reset Sequence
        const nextValue = parseInt(maxId) + 1;
        await pool.query(`ALTER SEQUENCE ${seqName} RESTART WITH ${nextValue}`);

        console.log(`SUCCESS: Sequence ${seqName} restarted with ${nextValue}`);

    } catch (error) {
        console.error('Error fixing sequence:', error);
    } finally {
        await pool.end();
    }
}

fixSequence();
