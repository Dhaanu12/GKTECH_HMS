require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');

async function checkDoctorPatients() {
    try {
        console.log('--- Checking Doctor-Patient Relationships ---\n');

        // 1. Check total doctors
        const doctorsRes = await query(`
            SELECT d.doctor_id, d.user_id, u.username, 
                   d.first_name, d.last_name, d.specialization
            FROM doctors d
            JOIN users u ON d.user_id = u.user_id
            WHERE u.is_active = true
            LIMIT 5
        `);
        console.log(`\nTotal Active Doctors (first 5): ${doctorsRes.rows.length}`);
        doctorsRes.rows.forEach(doc => {
            console.log(`  - ${doc.first_name} ${doc.last_name} (user_id: ${doc.user_id}, doctor_id: ${doc.doctor_id})`);
        });

        // 2. Check appointments with doctors
        const appointmentsRes = await query(`
            SELECT COUNT(*) as count, a.doctor_id
            FROM appointments a
            GROUP BY a.doctor_id
            LIMIT 5
        `);
        console.log(`\nAppointments by Doctor (first 5):`);
        appointmentsRes.rows.forEach(row => {
            console.log(`  - Doctor ID ${row.doctor_id}: ${row.count} appointments`);
        });

        // 3. Check OPD entries with doctors
        const opdRes = await query(`
            SELECT COUNT(*) as count, o.doctor_id
            FROM opd_entries o
            GROUP BY o.doctor_id
            LIMIT 5
        `);
        console.log(`\nOPD Entries by Doctor (first 5):`);
        opdRes.rows.forEach(row => {
            console.log(`  - Doctor ID ${row.doctor_id}: ${row.count} OPD entries`);
        });

        // 4. Test the actual query for the first doctor
        if (doctorsRes.rows.length > 0) {
            const firstDoctor = doctorsRes.rows[0];
            console.log(`\n--- Testing getMyPatients query for ${firstDoctor.first_name} (user_id: ${firstDoctor.user_id}) ---`);

            const testSql = `
                SELECT p.*,
                       MAX(GREATEST(COALESCE(a.appointment_date, '1900-01-01'), COALESCE(o.visit_date, '1900-01-01'))) as last_visit,
                       BOOL_OR(o.is_mlc) as is_mlc
                FROM patients p
                LEFT JOIN appointments a ON p.patient_id = a.patient_id
                LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
                LEFT JOIN doctors d ON (a.doctor_id = d.doctor_id OR o.doctor_id = d.doctor_id)
                WHERE d.user_id = $1 AND d.user_id IS NOT NULL
                GROUP BY p.patient_id ORDER BY last_visit DESC
            `;

            const testRes = await query(testSql, [firstDoctor.user_id]);
            console.log(`Query returned ${testRes.rows.length} patients`);
            if (testRes.rows.length > 0) {
                console.log('First 3 patients:', testRes.rows.slice(0, 3).map(p => ({
                    id: p.patient_id,
                    name: `${p.first_name} ${p.last_name}`
                })));
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkDoctorPatients();
