const { pool } = require('../config/db');

async function cleanData() {
    try {
        console.log('🗑️ Cleaning data...');

        // Truncate tables and restart identity (sequences)
        // CASCADE ensures dependent tables (like if there are any FKs to these) are also handled or checks allow it
        // We want to clear Appointments, OPD Entries, and Patients.
        // Assuming Patients is the parent table for Appointments and OPD Entries.

        await pool.query('TRUNCATE TABLE appointments, opd_entries, patients RESTART IDENTITY CASCADE');

        console.log('✅ Data cleaned successfully.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error cleaning data:', error);
        process.exit(1);
    }
}

cleanData();
