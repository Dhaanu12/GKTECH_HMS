const { getClient } = require('../config/db');

async function testInsert() {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        console.log('Testing OPD Insert...');

        // Get a patient
        const patRes = await client.query('SELECT patient_id, mrn_number FROM patients LIMIT 1');
        const patient = patRes.rows[0];
        console.log('Patient:', patient);

        const res = await client.query(`
            INSERT INTO opd_entries (
                opd_number, patient_id, branch_id, doctor_id, 
                visit_type, visit_date, visit_time, token_number,
                reason_for_visit, symptoms, vital_signs, chief_complaint,
                consultation_fee, payment_status, payment_method, visit_status,
                is_mlc, created_by, checked_in_by, mrn_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Fever', 'Headache', '{}', 'High Fever', 500, 'Paid', 'Cash', 'Completed', false, $9, $10, $11)
            RETURNING opd_id
        `, [
            'OPD-TEST-1', patient.patient_id, 1, 4,
            'Walk-in', new Date(), '10:00:00', 'T-1',
            'TEST_USER', 'TEST_USER', patient.mrn_number
        ]);

        console.log('Insert Success:', res.rows[0]);
        await client.query('ROLLBACK'); // Rollback to not pollute
    } catch (e) {
        console.error('Insert Failed:', e);
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
}

testInsert();
