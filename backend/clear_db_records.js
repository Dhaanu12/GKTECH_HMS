const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const tables = [
    'patients',
    'opd_entries',
    'appointments',
    'billings',
    'billing_items',
    'billing_master',
    'bill_details',
    'patient_vitals',
    'clinical_notes',
    'prescriptions',
    'lab_orders',
    'insurance_claims'
];

async function getCounts(client) {
    const counts = {};
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
            counts[table] = parseInt(res.rows[0].count);
        } catch (e) {
            counts[table] = 'NotExist';
        }
    }
    return counts;
}

async function clearRecords() {
    console.log('--- Database Record Cleanup ---');
    console.log(`Target Database: ${process.env.DB_NAME}\n`);

    const client = await pool.connect();
    try {
        const countsBefore = await getCounts(client);
        console.log('Counts BEFORE cleanup:');
        console.table(countsBefore);

        console.log('\nTruncating tables...');
        await client.query('BEGIN');

        for (const table of tables) {
            if (countsBefore[table] !== 'NotExist') {
                console.log(`Cleaning ${table}...`);
                await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
            }
        }

        await client.query('COMMIT');
        console.log('\nCleanup committed successfully.');

        const countsAfter = await getCounts(client);
        console.log('\nCounts AFTER cleanup:');
        console.table(countsAfter);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('\n❌ Error during cleanup:', error.message);
    } finally {
        client.release();
        await pool.end();
        console.log('\n--- Cleanup Finished ---');
    }
}

clearRecords();
