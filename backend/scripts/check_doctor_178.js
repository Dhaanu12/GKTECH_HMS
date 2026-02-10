require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');

async function checkDoctor178() {
    try {
        console.log('--- Checking Doctor user_id 178 ---\n');

        // 1. Find doctor
        const docRes = await query(`
            SELECT d.*, u.username 
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            WHERE d.user_id = $1
        `, [178]);

        if (docRes.rows.length === 0) {
            console.log('No doctor found with user_id 178');
            return;
        }

        const doc = docRes.rows[0];
        console.log('Doctor:', doc);
        console.log(`Doctor ID: ${doc.doctor_id}`);

        // 2. Check appointments
        const apptRes = await query(`
            SELECT COUNT(*) as count, array_agg(DISTINCT patient_id) as patient_ids
            FROM appointments
            WHERE doctor_id = $1
        `, [doc.doctor_id]);
        console.log('\nAppointments:', apptRes.rows[0]);

        // 3. Check OPD entries
        const opdRes = await query(`
            SELECT COUNT(*) as count, array_agg(DISTINCT patient_id) as patient_ids
            FROM opd_entries
            WHERE doctor_id = $1
        `, [doc.doctor_id]);
        console.log('OPD Entries:', opdRes.rows[0]);

        // 4. Get unique patient IDs
        const combinedRes = await query(`
            SELECT DISTINCT patient_id 
            FROM (
                SELECT patient_id FROM appointments WHERE doctor_id = $1
                UNION
                SELECT patient_id FROM opd_entries WHERE doctor_id = $1
            ) combined
        `, [doc.doctor_id]);

        console.log(`\nTotal unique patients: ${combinedRes.rows.length}`);
        if (combinedRes.rows.length > 0) {
            console.log('Patient IDs:', combinedRes.rows.map(r => r.patient_id));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkDoctor178();
