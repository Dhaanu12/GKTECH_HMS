const { query } = require('../config/db');

async function updateConsultationTable() {
    try {
        console.log('Starting migration: update_consultation_columns...');

        // Add diagnostic_center column
        await query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS diagnostic_center VARCHAR(255);
        `);
        console.log('Added diagnostic_center column');

        // Add labs column (JSONB for storing lab orders in outcome)
        await query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS labs JSONB;
        `);
        console.log('Added labs column');

        // Add referral_doctor_id column
        await query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS referral_doctor_id INTEGER;
        `);
        console.log('Added referral_doctor_id column');

        // Add referral_notes column
        await query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS referral_notes TEXT;
        `);
        console.log('Added referral_notes column');

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        process.exit();
    }
}

updateConsultationTable();
