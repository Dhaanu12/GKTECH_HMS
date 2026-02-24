const { Client } = require('pg');

async function fixConstraint() {
    const client = new Client({
        connectionString: 'postgres://postgres:root@localhost:5432/hms_database_beta'
    });

    try {
        await client.connect();
        await client.query('ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_status_check;');
        await client.query(`ALTER TABLE appointments ADD CONSTRAINT appointments_appointment_status_check CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Checked-in', 'In OPD', 'Completed', 'Cancelled', 'No-show', 'Rescheduled'));`);
        console.log('Constraint updated successfully.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
}

fixConstraint();
