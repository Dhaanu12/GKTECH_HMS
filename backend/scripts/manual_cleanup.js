const { query } = require('../config/db');

async function clearDatabase() {
    try {
        console.log('Starting database cleanup...');

        // Delete in order of dependencies (child first)
        await query('DELETE FROM bill_details');
        console.log('Cleared bill_details');

        await query('DELETE FROM billing_master');
        console.log('Cleared billing_master');

        await query('DELETE FROM appointments');
        console.log('Cleared appointments');

        await query('DELETE FROM opd_entries');
        console.log('Cleared opd_entries');

        await query('DELETE FROM patients');
        console.log('Cleared patients');

        console.log('Database cleanup completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
}

clearDatabase();
