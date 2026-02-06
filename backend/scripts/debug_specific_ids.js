const { pool } = require('../config/db');

async function debugSpecificIds() {
    try {
        console.log('🐞 INSPECTING SPECIFIC IDS: 4, 5, 6, 8');

        const res = await pool.query(`
            SELECT appointment_id, appointment_date, appointment_status, phone_number
            FROM appointments 
            WHERE appointment_id IN (4, 5, 6, 8)
        `);

        console.log(`FOUND: ${res.rows.length}`);
        res.rows.forEach(r => {
            // Log date as ISO string to see time component
            const d = new Date(r.appointment_date);
            console.log(`ID:${r.appointment_id} DATE:${d.toISOString()} STATUS:${r.appointment_status} PHONE:${r.phone_number}`);
        });

        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

debugSpecificIds();
