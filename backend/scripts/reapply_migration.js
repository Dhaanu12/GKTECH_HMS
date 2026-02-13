const { Pool } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Dropping existing constraint...');
        await pool.query('ALTER TABLE opd_entries DROP CONSTRAINT IF EXISTS opd_entries_visit_status_check');

        console.log('Adding new constraint with Rescheduled...');
        await pool.query(`
            ALTER TABLE opd_entries ADD CONSTRAINT opd_entries_visit_status_check
            CHECK (visit_status IN ('Registered', 'In-consultation', 'Completed', 'Cancelled', 'Rescheduled'))
        `);

        console.log('Migration applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
