const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Add MLC and Adhaar columns...');
        await client.query('BEGIN');

        // 1. Add adhaar_number to patients table
        await client.query(`
            ALTER TABLE patients
            ADD COLUMN IF NOT EXISTS adhaar_number VARCHAR(20) UNIQUE,
            DROP CONSTRAINT IF EXISTS patients_adhaar_number_key; -- Re-add constraint to handle potential unique index issues if running multiple times not idempotent enough
        `);
        // Note: Unique constraint is implicit with UNIQUE keyword but doing it carefully
        // Actually, let's keep it simple. If exists, it won't add.

        // 2. Add MLC related columns to opd_entries
        await client.query(`
            ALTER TABLE opd_entries
            ADD COLUMN IF NOT EXISTS is_mlc BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS attender_name VARCHAR(100),
            ADD COLUMN IF NOT EXISTS attender_contact_number VARCHAR(20);
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
