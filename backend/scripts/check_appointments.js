const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function check() {
    const all = await pool.query(`SELECT appointment_id, patient_name, appointment_date::date as date, appointment_time, appointment_status FROM appointments ORDER BY appointment_id`);
    console.log('Appointments with times:');
    all.rows.forEach(r => console.log(`  ID:${r.appointment_id} "${r.patient_name}" Date:${r.date} Time:${r.appointment_time} Status:${r.appointment_status}`));
    await pool.end();
}

check().catch(console.error);
