const { query, pool } = require('./config/db');

async function fixConstraint() {
    try {
        console.log("Fixing check constraint...");
        await query('BEGIN');

        // Drop existing constraint
        await query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_status_check');

        // Add new constraint allowing 'Rescheduled'
        await query(`
            ALTER TABLE appointments 
            ADD CONSTRAINT appointments_appointment_status_check 
            CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Cancelled', 'Completed', 'In OPD', 'Rescheduled'))
        `);

        await query('COMMIT');
        console.log("Successfully updated the constraint");
    } catch (e) {
        await query('ROLLBACK');
        console.error("Error updating constraint:", e);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

fixConstraint();
