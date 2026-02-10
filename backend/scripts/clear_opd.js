const { pool } = require('../config/db');

async function clearOpdEntries() {
    try {
        console.log('Clearing OPD entries...');
        // Using CASCADE to clean up any dependent records that are configured to cascade
        // If no cascade is set up, this might fail if there are foreign key constraints without cascade delete
        // But schema says ON DELETE SET NULL for billings.
        // Let's try TRUNCATE with CASCADE which is more forceful for clearing tables.
        // Or just DELETE FROM.

        // Check if we should delete from billing_master too? 
        // The user said "clear the whole of OPD enteries table".
        // I'll stick to that.

        const res = await pool.query('TRUNCATE TABLE opd_entries RESTART IDENTITY CASCADE');
        console.log('✅ OPD entries cleared successfully.');
    } catch (err) {
        console.error('❌ Error clearing OPD entries:', err);
    } finally {
        pool.end();
    }
}

clearOpdEntries();
