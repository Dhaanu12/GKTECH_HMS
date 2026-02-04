const { pool } = require('../config/db');

async function migrate() {
    try {
        console.log('🔄 Sgatting migration: Update visit_type constraint...');

        await pool.query(`
            ALTER TABLE opd_entries DROP CONSTRAINT IF EXISTS opd_entries_visit_type_check;
            ALTER TABLE opd_entries ADD CONSTRAINT opd_entries_visit_type_check 
            CHECK (visit_type IN ('Walk-in', 'Follow-up', 'Emergency', 'Referral', 'Appointment'));
        `);

        console.log('✅ Migration successful: visit_type constraint updated.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
