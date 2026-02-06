const { pool } = require('../config/db');

async function debugRawForDate() {
    try {
        const date = '2026-02-05';
        console.log(`CHECKING_DB_FOR_${date}`);

        const res = await pool.query(`
            SELECT appointment_id, appointment_status
            FROM appointments 
            WHERE appointment_date = $1
            ORDER BY appointment_id
        `, [date]);

        console.log(`COUNT:${res.rows.length}`);
        res.rows.forEach(r => {
            console.log(`ID:${r.appointment_id}|STATUS:${r.appointment_status}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugRawForDate();
