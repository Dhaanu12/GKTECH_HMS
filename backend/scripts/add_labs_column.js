const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration: Add labs column...');
        await client.query('BEGIN');

        // Add labs to prescriptions if not exists
        await client.query(`
            ALTER TABLE prescriptions 
            ADD COLUMN IF NOT EXISTS labs JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Added labs to prescriptions table');

        // Add labs to consultation_outcomes if not exists
        await client.query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS labs JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Added labs to consultation_outcomes table');

        await client.query('COMMIT');
        console.log('✅ Migration successful: labs column added.');
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
