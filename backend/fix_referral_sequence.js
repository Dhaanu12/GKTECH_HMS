const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function fixSequence() {
    try {
        console.log('Fixing sequence for referral_doctor_module...');
        
        // This query resets the sequence to the maximum ID in the table + 1
        const res = await pool.query(`
            SELECT setval(pg_get_serial_sequence('referral_doctor_module', 'id'), COALESCE(MAX(id), 0) + 1, false) 
            FROM referral_doctor_module;
        `);
        
        console.log('Sequence fixed successfully!');
        if (res.rows[0] && res.rows[0].setval) {
            console.log(`Current sequence value set to: ${res.rows[0].setval}`);
        }
    } catch (err) {
        console.error('Error fixing sequence:', err);
    } finally {
        await pool.end();
    }
}

fixSequence();
