const { query } = require('./config/db');

async function testDuplicateCheck() {
    try {
        console.log('--- Testing OPD Duplicate Check Logic ---');

        // 1. Find a doctor, patient and a date
        const doctorRes = await query('SELECT doctor_id FROM doctors LIMIT 1');
        const patientRes = await query('SELECT patient_id FROM patients LIMIT 1');

        if (doctorRes.rows.length === 0 || patientRes.rows.length === 0) {
            console.log('Insufficient data for test (need at least 1 doctor and 1 patient)');
            process.exit(0);
        }

        const doctor_id = doctorRes.rows[0].doctor_id;
        const patient_id = patientRes.rows[0].patient_id;
        const visit_date = new Date().toISOString().split('T')[0];

        console.log(`Using Doctor ID: ${doctor_id}, Patient ID: ${patient_id}, Date: ${visit_date}`);

        // 2. Clean up any existing entries for today to have a clean start
        await query('DELETE FROM opd_entries WHERE patient_id = $1 AND doctor_id = $2 AND visit_date = $3', [patient_id, doctor_id, visit_date]);

        // 3. Create a 'Completed' entry
        await query(`
            INSERT INTO opd_entries (
                opd_number, patient_id, branch_id, doctor_id, visit_type, visit_date, visit_time, visit_status, token_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [`OPD-TEST-${Date.now()}`, patient_id, 1, doctor_id, 'Walk-in', visit_date, '10:00', 'Completed', 'T-101']);

        console.log('Created a COMPLETED OPD entry for today.');

        // 4. Test the query directly (simulating checkDuplicate)
        const duplicateCheck = await query(
            `SELECT opd_id FROM opd_entries 
             WHERE patient_id = $1 AND doctor_id = $2 AND visit_date = $3 
             AND visit_status NOT IN ('Cancelled', 'Completed')`,
            [patient_id, doctor_id, visit_date]
        );

        if (duplicateCheck.rows.length === 0) {
            console.log('SUCCESS: Duplicate check (direct query) bypassed the Completed entry.');
        } else {
            console.error('FAILURE: Duplicate check (direct query) still flagged the Completed entry.');
        }

        // 5. Create a 'Registered' entry
        await query(`
            INSERT INTO opd_entries (
                opd_number, patient_id, branch_id, doctor_id, visit_type, visit_date, visit_time, visit_status, token_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [`OPD-TEST-${Date.now() + 1}`, patient_id, 1, doctor_id, 'Walk-in', visit_date, '11:00', 'Registered', 'T-102']);

        console.log('Created a REGISTERED OPD entry for today.');

        // 6. Test the query again
        const duplicateCheck2 = await query(
            `SELECT opd_id FROM opd_entries 
             WHERE patient_id = $1 AND doctor_id = $2 AND visit_date = $3 
             AND visit_status NOT IN ('Cancelled', 'Completed')`,
            [patient_id, doctor_id, visit_date]
        );

        if (duplicateCheck2.rows.length > 0) {
            console.log('SUCCESS: Duplicate check (direct query) correctly flagged the Registered entry.');
        } else {
            console.error('FAILURE: Duplicate check (direct query) failed to flag the Registered entry.');
        }

        // Cleanup
        await query('DELETE FROM opd_entries WHERE opd_number LIKE \'OPD-TEST-%\'');
        console.log('Cleanup completed.');

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        process.exit(0);
    }
}

testDuplicateCheck();
