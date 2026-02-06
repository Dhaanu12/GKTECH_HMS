const { pool } = require('../config/db');

async function debugFullDump() {
    try {
        console.log('🐞 DUMPING ALL DATA...');

        const appts = await pool.query('SELECT appointment_id, appointment_date, appointment_time, appointment_status, patient_id, phone_number FROM appointments ORDER BY appointment_id DESC');
        console.log(`\n📋 ALL APPOINTMENTS (${appts.rows.length}):`);
        appts.rows.forEach(r => {
            // Log raw date/time to see format
            console.log(`   ID:${r.appointment_id} Date:${r.appointment_date} Time:${r.appointment_time} Status:${r.appointment_status} Phone:${r.phone_number}`);
        });

        const opds = await pool.query('SELECT opd_id, visit_date, visit_time, visit_status, patient_id FROM opd_entries ORDER BY opd_id DESC');
        console.log(`\n🏥 ALL OPD ENTRIES (${opds.rows.length}):`);
        opds.rows.forEach(r => {
            console.log(`   ID:${r.opd_id} Date:${r.visit_date} Time:${r.visit_time} Status:${r.visit_status} PatID:${r.patient_id}`);
        });

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

debugFullDump();
