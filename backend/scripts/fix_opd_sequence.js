const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function fixOpdSequence() {
    try {
        console.log('Fixing OPD sequence...');

        const seqName = 'opd_entries_opd_id_seq';

        // 1. Get Max ID
        const maxIdRes = await pool.query('SELECT MAX(opd_id) as max_id FROM opd_entries');
        const maxId = maxIdRes.rows[0].max_id || 0;
        console.log('Max opd_id:', maxId);

        // 2. Reset Sequence
        const nextValue = parseInt(maxId) + 1;
        await pool.query(`ALTER SEQUENCE ${seqName} RESTART WITH ${nextValue}`);

        console.log(`SUCCESS: Sequence ${seqName} restarted with ${nextValue}`);

    } catch (error) {
        console.error('Error fixing OPD sequence:', error);
    } finally {
        await pool.end();
    }
}

fixOpdSequence();
