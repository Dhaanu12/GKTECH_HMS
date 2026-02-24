const db = require('./config/db');

async function checkConstraints() {
    const client = await db.getClient();
    try {
        const res = await client.query(`
            SELECT pg_get_constraintdef(c.oid) as def
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'appointments'::regclass AND conname = 'appointments_appointment_status_check';
        `);
        if (res.rows.length > 0) {
            console.log(res.rows[0].def);
        } else {
            console.log("No such constraint");
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkConstraints();
