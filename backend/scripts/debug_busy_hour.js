const { pool } = require('../config/db');

async function debugBusyHour() {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Checking 10 AM for Date: ${today}`);

        const apptResult = await pool.query(`SELECT * FROM appointments WHERE appointment_date = $1`, [today]);
        const opdResult = await pool.query(`SELECT * FROM opd_entries WHERE visit_date = $1`, [today]);

        console.log('\n--- 10 AM APPOINTMENTS (Status: Scheduled/Confirmed) ---');
        let countAppt = 0;
        apptResult.rows.forEach(a => {
            const h = parseInt(a.appointment_time.split(':')[0]);
            if (h === 10 && ['Scheduled', 'Confirmed'].includes(a.appointment_status)) {
                countAppt++;
                console.log(`[${a.appointment_status}] ID:${a.appointment_id} Name:${a.patient_name} Phone:${a.phone_number} Doc:${a.doctor_id}`);
            }
        });

        console.log('\n--- 10 AM OPD ENTRIES ---');
        let countOpd = 0;
        opdResult.rows.forEach(e => {
            const h = parseInt(e.visit_time.split(':')[0]);
            if (h === 10) {
                countOpd++;
                console.log(`[${e.visit_status}] ID:${e.opd_id} PatientID:${e.patient_id} Doc:${e.doctor_id}`);
            }
        });

        console.log(`\nTotal 10 AM: ${countAppt + countOpd}`);
        process.exit(0);
    } catch (error) {
        process.exit(1);
    }
}

debugBusyHour();
