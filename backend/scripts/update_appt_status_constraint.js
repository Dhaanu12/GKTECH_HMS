const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Update appointment_status check constraint...');
        await client.query('BEGIN');

        // 1. Drop the existing check constraint
        // Note: The constraint name 'appointments_appointment_status_check' comes from the error message
        await client.query(`
            ALTER TABLE appointments 
            DROP CONSTRAINT IF EXISTS appointments_appointment_status_check;
        `);

        // 2. Add the updated check constraint including 'In OPD' and 'No-show'
        await client.query(`
            ALTER TABLE appointments 
            ADD CONSTRAINT appointments_appointment_status_check 
            CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Checked-in', 'In OPD', 'Completed', 'Cancelled', 'No-show'));
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
