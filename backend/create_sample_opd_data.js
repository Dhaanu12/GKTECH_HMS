const db = require('./config/db');

async function createSampleData() {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        // 1. Create a sample patient
        const patientResult = await client.query(`
            INSERT INTO patients (
                mrn_number, 
                patient_code, 
                first_name, 
                last_name, 
                age, 
                gender, 
                contact_number, 
                registration_date,
                blood_group,
                address,
                city,
                state,
                pincode,
                adhaar_number
            ) VALUES (
                'MRN-20260209-0001',
                'PAT-123456',
                'Rajesh',
                'Kumar',
                35,
                'Male',
                '9876543210',
                CURRENT_DATE,
                'O+',
                '123 Main Street',
                'Chennai',
                'Tamil Nadu',
                '600001',
                '1234-5678-9012'
            ) RETURNING patient_id, mrn_number, first_name, last_name
        `);

        const patient = patientResult.rows[0];
        console.log('✅ Patient created:', patient);

        // 2. Create an OPD entry for this patient
        // Note: You'll need to replace these IDs with actual values from your database
        const opdResult = await client.query(`
            INSERT INTO opd_entries (
                opd_number,
                patient_id,
                branch_id,
                doctor_id,
                visit_type,
                visit_date,
                visit_time,
                token_number,
                reason_for_visit,
                symptoms,
                chief_complaint,
                consultation_fee,
                payment_status,
                payment_method,
                visit_status,
                checked_in_by,
                checked_in_time,
                is_mlc
            ) VALUES (
                'OPD-20260209-1001',
                $1,
                55,  -- Replace with your branch_id
                39,  -- Replace with your doctor_id
                'Walk-in',  -- Must be: Walk-in, Follow-up, Emergency, Referral, or Appointment
                CURRENT_DATE,
                CURRENT_TIME,
                'T-1',
                'Fever and headache',
                'High fever, severe headache, body pain',
                'Fever',
                500,
                'Paid',
                'Cash',
                'Registered',
                178,  -- Replace with your user_id (receptionist)
                CURRENT_TIMESTAMP,
                false
            ) RETURNING opd_id, opd_number, token_number, visit_status
        `, [patient.patient_id]);

        const opd = opdResult.rows[0];
        console.log('✅ OPD Entry created:', opd);

        await client.query('COMMIT');

        console.log('\n📊 Summary:');
        console.log('Patient ID:', patient.patient_id);
        console.log('Patient Name:', `${patient.first_name} ${patient.last_name}`);
        console.log('MRN:', patient.mrn_number);
        console.log('OPD ID:', opd.opd_id);
        console.log('OPD Number:', opd.opd_number);
        console.log('Token:', opd.token_number);
        console.log('Status:', opd.visit_status);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating sample data:', error);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

createSampleData();
