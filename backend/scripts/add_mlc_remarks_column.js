const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration: Add mlc_remarks column to opd_entries...');
        await client.query('BEGIN');

        // Add mlc_remarks column if not exists
        await client.query(`
            ALTER TABLE opd_entries 
            ADD COLUMN IF NOT EXISTS mlc_remarks TEXT;
        `);
        console.log('✅ Added mlc_remarks column');

        await client.query('COMMIT');
        console.log('✅ Migration successful: mlc_remarks column added to opd_entries.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
