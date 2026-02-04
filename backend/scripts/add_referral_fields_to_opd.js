const { pool } = require('../config/db');

async function addReferralFieldsToOpd() {
    try {
        console.log('🔄 Starting migration: Add referral fields to opd_entries...');

        await pool.query(`
            ALTER TABLE opd_entries 
            ADD COLUMN IF NOT EXISTS referral_hospital VARCHAR(255),
            ADD COLUMN IF NOT EXISTS referral_doctor_name VARCHAR(255);
        `);

        console.log('✅ Migration successful: Referral fields added to opd_entries table.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

addReferralFieldsToOpd();
