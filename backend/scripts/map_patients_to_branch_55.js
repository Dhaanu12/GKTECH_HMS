require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');

async function mapPatientsToBranch55() {
    try {
        console.log('=== Mapping Last 20 Patients to Branch 55 ===\n');

        // 1. Find a doctor at branch 55
        console.log('1. Finding doctors at branch 55...');
        const doctorRes = await query(`
            SELECT d.doctor_id, d.first_name, d.last_name, d.user_id
            FROM doctors d
            JOIN doctor_branches db ON d.doctor_id = db.doctor_id
            WHERE db.branch_id = 55
            LIMIT 1
        `);

        let doctor;
        if (doctorRes.rows.length === 0) {
            console.log('⚠️  No doctors at branch 55. Using any available doctor...');
            const anyDoctorRes = await query(`SELECT * FROM doctors LIMIT 1`);
            if (anyDoctorRes.rows.length === 0) {
                console.log('❌ No doctors found. Cannot proceed.');
                return;
            }
            doctor = anyDoctorRes.rows[0];
        } else {
            doctor = doctorRes.rows[0];
        }
        console.log(`✅ Using doctor: ${doctor.first_name} ${doctor.last_name} (ID: ${doctor.doctor_id})\n`);

        // 2. Get last 20 patients
        console.log('2. Getting last 20 patients...');
        const patientsRes = await query(`
            SELECT patient_id, first_name, last_name
            FROM patients
            WHERE is_active = true
            ORDER BY created_at DESC
            LIMIT 20
        `);
        console.log(`✅ Found ${patientsRes.rows.length} patients\n`);

        // 3. Create OPD entries for each patient
        console.log('3. Creating OPD entries...');
        let created = 0;
        const today = new Date().toISOString().split('T')[0].replace(/-/g, '');

        for (const patient of patientsRes.rows) {
            try {
                // Check if patient already has OPD at this branch
                const existingRes = await query(`
                    SELECT opd_id FROM opd_entries 
                    WHERE patient_id = $1 AND branch_id = 55
                    LIMIT 1
                `, [patient.patient_id]);

                if (existingRes.rows.length > 0) {
                    console.log(`   ⏭️  Patient ${patient.first_name} ${patient.last_name} already has OPD`);
                    created++; // Count as mapped
                    continue;
                }

                // Generate OPD number: OPD-YYYYMMDD-XXXX
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const opdNumber = `OPD-${today}-${randomSuffix}`;

                // Create OPD entry
                const opdRes = await query(`
                    INSERT INTO opd_entries (
                        opd_number,
                        patient_id, 
                        doctor_id, 
                        branch_id, 
                        visit_date, 
                        visit_time,
                        visit_type,
                        consultation_fee,
                        visit_status,
                        payment_status
                    ) VALUES ($1, $2, $3, 55, CURRENT_DATE, CURRENT_TIME, 'Walk-in', 500, 'Completed', 'Paid')
                    RETURNING opd_id
                `, [opdNumber, patient.patient_id, doctor.doctor_id]);

                console.log(`   ✅ ${patient.first_name} ${patient.last_name} → OPD ${opdNumber}`);
                created++;

            } catch (err) {
                console.log(`   ❌ ${patient.first_name}: ${err.message.substring(0, 60)}`);
            }
        }

        console.log(`\n✅ Successfully mapped ${created} patients to branch 55`);

        // 4. Verify
        console.log('\n4. Verification:');
        const verifyRes = await query(`
            SELECT COUNT(DISTINCT p.patient_id) as count
            FROM patients p
            JOIN opd_entries o ON p.patient_id = o.patient_id
            WHERE o.branch_id = 55 AND p.is_active = true
        `);
        console.log(`   Total patients at branch 55: ${verifyRes.rows[0].count}`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        process.exit();
    }
}

mapPatientsToBranch55();
