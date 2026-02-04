const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🔄 Starting migration: Add draft-related columns to consultation_outcomes...');
        await client.query('BEGIN');

        // Add medications column if not exists
        await client.query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS medications JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Added medications column');

        // Add referral_doctor_id column if not exists
        await client.query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS referral_doctor_id INTEGER REFERENCES referral_doctors(referral_doctor_id);
        `);
        console.log('✅ Added referral_doctor_id column');

        // Add referral_notes column if not exists
        await client.query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS referral_notes TEXT;
        `);
        console.log('✅ Added referral_notes column');

        await client.query('COMMIT');
        console.log('✅ Migration successful: Draft columns added to consultation_outcomes.');
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
