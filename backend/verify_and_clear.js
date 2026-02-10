
const { Pool } = require('pg');

// Hardcoded connection string to match the one that worked in the diagnosis step
const connectionString = 'postgresql://postgres:root@localhost:5432/hms_database_beta';

const pool = new Pool({
    connectionString,
});

async function clearDatabase() {
    const client = await pool.connect();
    try {
        console.log('Connected to:', connectionString);

        // Check counts before
        const beforeCounts = await getCounts(client);
        console.log('Counts BEFORE clearance:', beforeCounts);

        await client.query('BEGIN');

        console.log('Truncating tables...');
        // Truncate tables with CASCADE
        await client.query('TRUNCATE TABLE patients RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE appointments RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE opd_entries RESTART IDENTITY CASCADE');
        await client.query('TRUNCATE TABLE billing_master RESTART IDENTITY CASCADE');

        await client.query('COMMIT');
        console.log('Truncate committed.');

        // Check counts after
        const afterCounts = await getCounts(client);
        console.log('Counts AFTER clearance:', afterCounts);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error during clearance:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

async function getCounts(client) {
    const tables = ['patients', 'appointments', 'opd_entries', 'billing_master', 'bill_details'];
    const counts = {};
    for (const table of tables) {
        try {
            const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
            counts[table] = parseInt(res.rows[0].count);
        } catch (e) {
            counts[table] = 'Error/NotExist';
        }
    }
    return counts;
}

clearDatabase();
