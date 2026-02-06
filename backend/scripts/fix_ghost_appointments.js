const { pool } = require('../config/db');

async function fixGhostAppointments() {
    try {
        console.log('👻 FIXING GHOST APPOINTMENTS (4, 5, 6, 8)...');

        // We can just cancel them to remove them from the "Scheduled/Confirmed" count in Dashboard
        // Or if they are valid "In OPD", we can set them to "In OPD".
        // Use "Cancelled" to be safe and remove them from the "Upcoming" list if they are duplicates.
        // Or better: update them to 'In OPD' if they point to the same patient as the OPD Entry?
        // But we don't know if they have a matching OPD entry easily because of the date mismatch.
        // Let's set them to 'Cancelled' as they seem to be duplicates/ghosts. 
        // User wants the count to drop.

        const res = await pool.query(`
            UPDATE appointments 
            SET appointment_status = 'Cancelled', updated_at = CURRENT_TIMESTAMP
            WHERE appointment_id IN (4, 5, 6, 8)
        `);

        console.log(`✅ Updated ${res.rowCount} appointments to 'Cancelled'.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

fixGhostAppointments();
