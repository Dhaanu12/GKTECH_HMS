const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function clearData() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Clearing data...');

        // Truncate tables with CASCADE to handle foreign key constraints
        await client.query('TRUNCATE TABLE patients RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE appointments RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE opd_entries RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE billing_master RESTART IDENTITY CASCADE');
        // bill_details and payment_transactions will be cleared via CASCADE from billing_master/opd_entries
        // but let's be explicit if needed, though CASCADE on master tables is usually sufficient.
        // If independent tables exist, add them here.

        console.log('Successfully cleared: patients, appointments, opd_entries, billing_master and related tables.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error clearing data:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

clearData();
