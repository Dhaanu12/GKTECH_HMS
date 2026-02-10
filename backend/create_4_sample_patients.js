const db = require('./config/db');

async function create4SamplePatients() {
    const client = await db.getClient();

    try {
        await client.query('BEGIN');

        const patients = [
            {
                first_name: 'Priya',
                last_name: 'Sharma',
                age: 28,
                gender: 'Female',
                contact_number: '9876543211',
                blood_group: 'A+',
                address: '45 MG Road',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600002',
                adhaar_number: '2345-6789-0123',
                visit_type: 'Walk-in',
                reason: 'Fever and cold',
                symptoms: 'High fever, runny nose, body ache',
                chief_complaint: 'Fever'
            },
            {
                first_name: 'Arjun',
                last_name: 'Patel',
                age: 42,
                gender: 'Male',
                contact_number: '9876543212',
                blood_group: 'B+',
                address: '78 Anna Salai',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600003',
                adhaar_number: '3456-7890-1234',
                visit_type: 'Follow-up',
                reason: 'Diabetes checkup',
                symptoms: 'Regular checkup for diabetes management',
                chief_complaint: 'Diabetes'
            },
            {
                first_name: 'Lakshmi',
                last_name: 'Reddy',
                age: 35,
                gender: 'Female',
                contact_number: '9876543213',
                blood_group: 'O+',
                address: '12 T Nagar',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600004',
                adhaar_number: '4567-8901-2345',
                visit_type: 'Walk-in',
                reason: 'Headache',
                symptoms: 'Severe headache, dizziness',
                chief_complaint: 'Headache'
            },
            {
                first_name: 'Karthik',
                last_name: 'Iyer',
                age: 50,
                gender: 'Male',
                contact_number: '9876543214',
                blood_group: 'AB+',
                address: '89 Adyar',
                city: 'Chennai',
                state: 'Tamil Nadu',
                pincode: '600005',
                adhaar_number: '5678-9012-3456',
                visit_type: 'Emergency',
                reason: 'Chest pain',
                symptoms: 'Chest pain, shortness of breath',
                chief_complaint: 'Chest Pain'
            }
        ];

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        let tokenCounter = 2; // Start from T-2 since T-1 already exists

        console.log('Creating 4 sample patients with OPD entries...\n');

        for (const p of patients) {
            // 1. Create Patient
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
                    $1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, $9, $10, $11, $12, $13
                ) RETURNING patient_id, mrn_number, first_name, last_name
            `, [
                `MRN-${dateStr}-${String(tokenCounter).padStart(4, '0')}`,
                `PAT-${Math.floor(100000 + Math.random() * 900000)}`,
                p.first_name,
                p.last_name,
                p.age,
                p.gender,
                p.contact_number,
                p.blood_group,
                p.address,
                p.city,
                p.state,
                p.pincode,
                p.adhaar_number
            ]);

            const patient = patientResult.rows[0];

            // 2. Create OPD Entry
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
                    $1, $2, 55, 39, $3, CURRENT_DATE, CURRENT_TIME, $4,
                    $5, $6, $7, 500, 'Paid', 'Cash', 'Registered', 178,
                    CURRENT_TIMESTAMP, false
                ) RETURNING opd_id, opd_number, token_number
            `, [
                `OPD-${dateStr}-${1000 + tokenCounter}`,
                patient.patient_id,
                p.visit_type,
                `T-${tokenCounter}`,
                p.reason,
                p.symptoms,
                p.chief_complaint
            ]);

            const opd = opdResult.rows[0];

            console.log(`✅ Created Patient ${tokenCounter - 1}:`);
            console.log(`   Name: ${patient.first_name} ${patient.last_name}`);
            console.log(`   MRN: ${patient.mrn_number}`);
            console.log(`   Patient ID: ${patient.patient_id}`);
            console.log(`   OPD Number: ${opd.opd_number}`);
            console.log(`   Token: ${opd.token_number}`);
            console.log(`   Visit Type: ${p.visit_type}`);
            console.log('');

            tokenCounter++;
        }

        await client.query('COMMIT');

        console.log('📊 Summary:');
        console.log(`   Total Patients Created: 4`);
        console.log(`   Total OPD Entries Created: 4`);
        console.log(`   All patients registered for today (${new Date().toISOString().split('T')[0]})`);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error creating sample data:', error);
        throw error;
    } finally {
        client.release();
        process.exit(0);
    }
}

create4SamplePatients();
