const { pool } = require('../config/db');

async function fixAppointmentStatus() {
    try {
        console.log('🔧 Checking for inconsistent appointment statuses...');

        // Query to find appointments that SHOULD be 'In OPD' but are not
        // Matches matching doctor, date, and (patient_id OR phone_number)
        const findQuery = `
            SELECT 
                a.appointment_id, 
                a.patient_name, 
                a.appointment_time, 
                a.appointment_status,
                o.opd_id
            FROM appointments a
            JOIN opd_entries o ON a.doctor_id = o.doctor_id AND a.appointment_date = o.visit_date
            LEFT JOIN patients p ON o.patient_id = p.patient_id
            WHERE 
                a.appointment_status IN ('Scheduled', 'Confirmed')
                AND (
                    (a.patient_id IS NOT NULL AND a.patient_id = o.patient_id)
                    OR 
                    (
                        a.patient_id IS NULL 
                        AND p.contact_number IS NOT NULL 
                        AND a.phone_number = p.contact_number
                    )
                )
        `;

        const result = await pool.query(findQuery);

        if (result.rows.length === 0) {
            console.log('✅ No inconsistent records found. Data looks clean.');
            process.exit(0);
        }

        console.log(`⚠️ Found ${result.rows.length} appointments that need fixing:`);
        result.rows.forEach(row => {
            console.log(`   - Appointment #${row.appointment_id} (${row.appointment_status}) for ${row.patient_name} at ${row.appointment_time}`);
        });

        console.log('🔄 Fixing statuses...');

        // Update query
        const updateQuery = `
            UPDATE appointments a
            SET appointment_status = 'In OPD', updated_at = CURRENT_TIMESTAMP
            FROM opd_entries o
            LEFT JOIN patients p ON o.patient_id = p.patient_id
            WHERE 
                a.doctor_id = o.doctor_id 
                AND a.appointment_date = o.visit_date
                AND a.appointment_status IN ('Scheduled', 'Confirmed')
                AND (
                    (a.patient_id IS NOT NULL AND a.patient_id = o.patient_id)
                    OR 
                    (a.patient_id IS NULL AND p.contact_number IS NOT NULL AND a.phone_number = p.contact_number)
                )
        `;

        const updateResult = await pool.query(updateQuery);

        console.log(`✅ Successfully updated ${updateResult.rowCount} appointments to 'In OPD'.`);
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fixing data:', error);
        process.exit(1);
    }
}

fixAppointmentStatus();
