const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Migrating schema...');

        // 1. Drop constraints (Best effort guess on standard naming, or query explicitly if needed)
        // Note: Postgres standard naming is table_column_fkey
        const dropConstraints = [
            "ALTER TABLE opd_entries DROP CONSTRAINT IF EXISTS opd_entries_checked_in_by_fkey",
            "ALTER TABLE billing_master DROP CONSTRAINT IF EXISTS billing_master_created_by_fkey",
            "ALTER TABLE billing_master DROP CONSTRAINT IF EXISTS billing_master_updated_by_fkey",
            "ALTER TABLE bill_details DROP CONSTRAINT IF EXISTS bill_details_created_by_fkey",
            // Also check for other constraint names manually if these fail, but usually they don't fail, just do nothing
        ];

        for (const query of dropConstraints) {
            await client.query(query);
        }

        // 2. Alter Columns
        const alterColumns = [
            "ALTER TABLE opd_entries ALTER COLUMN checked_in_by TYPE VARCHAR(50)",
            "ALTER TABLE billing_master ALTER COLUMN created_by TYPE VARCHAR(50)",
            "ALTER TABLE billing_master ALTER COLUMN updated_by TYPE VARCHAR(50)",
            "ALTER TABLE bill_details ALTER COLUMN created_by TYPE VARCHAR(50)",
            "ALTER TABLE bill_details ALTER COLUMN updated_by TYPE VARCHAR(50)"
        ];

        for (const query of alterColumns) {
            await client.query(query);
            console.log(`Executed: ${query}`);
        }

        await client.query('COMMIT');
        console.log('Schema migration successful.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
