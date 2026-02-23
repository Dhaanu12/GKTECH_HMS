const { query, pool } = require('./config/db');

async function clearDB() {
    try {
        console.log("Starting to clean tables...");
        await query('BEGIN');

        // Truncate tables with cascade to handle foreign keys
        await query('TRUNCATE TABLE appointments, opd_entries, patients, billing_master, bill_details, consultation_outcomes, lab_orders RESTART IDENTITY CASCADE');

        await query('COMMIT');
        console.log("Successfully cleared tables: appointments, opd_entries, patients, billing_master, bill_details, consultation_outcomes, lab_orders");
    } catch (e) {
        await query('ROLLBACK');
        console.error("Error clearing DB:", e);
    } finally {
        // End the pool so the script can exit
        await pool.end();
        process.exit(0);
    }
}

clearDB();
