const { getClient } = require('../config/db');

// Config
const HOSPITAL_ID = 4;
const BRANCH_ID = 1;
const DOCTOR_ID = 4;
const STAFF_CODE = 'SEED_SCRIPT';

// Helper to get random date in last X days
function getRandomDate(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
    // Random time between 9am and 8pm
    date.setHours(9 + Math.floor(Math.random() * 11));
    date.setMinutes(Math.floor(Math.random() * 60));
    return date;
}

function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

async function seedData() {
    const client = await getClient();
    try {
        await client.query('BEGIN');
        console.log('🌱 Starting seed...');

        // 1. Create Patients
        console.log('Creating patients...');
        const patients = [];
        const firstNames = ['Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan', 'Diya', 'Saanvi', 'Anya', 'Aadhya', 'Kiara', 'Ananya', 'Pari', 'Riya', 'Sana', 'Myra'];
        const lastNames = ['Sharma', 'Verma', 'Gupta', 'Malhotra', 'Bhatia', 'Saxena', 'Mehta', 'Chopra', 'Singh', 'Kumar'];

        for (let i = 0; i < 20; i++) {
            const fname = getRandomItem(firstNames);
            const lname = getRandomItem(lastNames);
            const mrn = `MRN-${Math.floor(100000 + Math.random() * 900000)}`;
            const pcode = `PT-${Math.floor(100000 + Math.random() * 900000)}`;
            const res = await client.query(`
                INSERT INTO patients (
                    first_name, last_name, gender, age, contact_number, 
                    mrn_number, patient_code, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                RETURNING patient_id, mrn_number
            `, [
                fname, lname, Math.random() > 0.5 ? 'Male' : 'Female',
                18 + Math.floor(Math.random() * 60),
                '9' + Math.floor(100000000 + Math.random() * 900000000),
                mrn, pcode
            ]);
            patients.push(res.rows[0]);
        }

        // 2. Create OPD Entries & Appointments
        console.log('Creating visits...');
        const diagnoses = ['Viral Fever', 'Hypertension', 'Type 2 Diabetes', 'Acute Bronchitis', 'Migraine', 'Gastritis', 'Pneumonia', 'UTI', 'Back Pain', 'Allergic Rhinitis'];
        const visitTypes = ['New', 'Follow-up', 'Review'];
        const opdIds = [];

        for (let i = 0; i < 50; i++) {
            const patient = getRandomItem(patients);
            const visitDate = getRandomDate(180); // Last 6 months
            const diagnosis = getRandomItem(diagnoses);

            const timeStr = visitDate.toTimeString().split(' ')[0];

            // Create Appointment
            if (Math.random() > 0.3) {
                const apptNum = `APT-${Math.floor(100000 + Math.random() * 900000)}`;
                await client.query(`
                    INSERT INTO appointments (
                        branch_id, patient_id, doctor_id, 
                        appointment_date, appointment_time, 
                        appointment_status, reason_for_visit, patient_name, phone_number,
                        appointment_number
                    ) VALUES ($1, $2, $3, $4, $5, 'Completed', 'Routine Checkup', 'Test Patient', '9999999999', $6)
                `, [BRANCH_ID, patient.patient_id, DOCTOR_ID, visitDate, timeStr, apptNum]);
            }

            // Create OPD Entry
            const visitTypes = ['Walk-in', 'Appointment', 'Follow-up'];
            const visitType = getRandomItem(visitTypes);

            console.log('Inserting OPD Entry:', { visitType, visitDate, timeStr, STAFF_CODE: 'SEED_SCRIPT', mrn: patient.mrn_number });
            const opdRes = await client.query(`
                INSERT INTO opd_entries (
                    opd_number, patient_id, branch_id, doctor_id, 
                    visit_type, visit_date, visit_time, token_number,
                    reason_for_visit, symptoms, vital_signs, chief_complaint,
                    consultation_fee, payment_status, payment_method, visit_status,
                    is_mlc, checked_in_by, mrn_number
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Fever', 'Headache', '{}', 'High Fever', 500, 'Paid', 'Cash', 'Completed', false, $9, $10)
                RETURNING opd_id, opd_number, patient_id, mrn_number
            `, [
                `OPD-${Math.floor(100000 + Math.random() * 900000)}`,
                patient.patient_id, BRANCH_ID, DOCTOR_ID,
                visitType, visitDate, timeStr,
                `T-${Math.floor(1 + Math.random() * 50)}`,
                'SEED_SCRIPT', patient.mrn_number
            ]);
            const opd = opdRes.rows[0];
            opdIds.push({ id: opd.opd_id, date: visitDate, patientId: opd.patient_id, mrn: opd.mrn_number, opdNumber: opd.opd_number });
        }

        // 3. Create Bills
        console.log('Creating bills...');
        const services = [
            { name: 'General Consultation', type: 'consultation', price: 500 },
            { name: 'Blood Test (CBC)', type: 'laboratory', price: 1200 },
            { name: 'X-Ray Chest', type: 'radiology', price: 800 },
            { name: 'MRI Scan', type: 'radiology', price: 5000 },
            { name: 'Pharmacy Meds', type: 'pharmacy', price: 450 },
            { name: 'ECG', type: 'procedure', price: 1500 }
        ];

        for (const opd of opdIds) {
            // 70% chance of having a bill
            if (Math.random() > 0.3) {
                const numItems = 1 + Math.floor(Math.random() * 3);
                let totalAmount = 0;
                const billDate = opd.date; // Bill on same day as visit

                // Create Master
                const masterRes = await client.query(`
                    INSERT INTO billing_master (
                        branch_id, patient_id, opd_id,
                        bill_number, invoice_number,
                        billing_date, total_amount, paid_amount, pending_amount,
                        payment_status, status, payment_mode, created_by,
                        mrn_number, opd_number, patient_name
                    ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, 'Paid', 'Paid', 'Cash', $7, $8, $9, 'Test Patient')
                    RETURNING bill_master_id
                `, [
                    BRANCH_ID, opd.patientId, opd.id,
                    `BILL-${Math.random().toString(36).substr(2, 9)}`,
                    `INV-${Math.random().toString(36).substr(2, 9)}`,
                    billDate, STAFF_CODE, opd.mrn, opd.opdNumber
                ]);
                const masterId = masterRes.rows[0].bill_master_id;

                // Add Items
                for (let k = 0; k < numItems; k++) {
                    const svc = getRandomItem(services);
                    await client.query(`
                        INSERT INTO bill_details (
                            bill_master_id, branch_id, patient_id, opd_id,
                            service_type, service_name, quantity, unit_price,
                            subtotal, final_price, status, created_by
                        ) VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $7, $7, 'Paid', $8)
                    `, [
                        masterId, BRANCH_ID, opd.patientId, opd.id,
                        svc.type, svc.name, svc.price, STAFF_CODE
                    ]);
                    totalAmount += svc.price;
                }

                // Update Master Total
                await client.query(`
                    UPDATE billing_master 
                    SET total_amount = $1, paid_amount = $1 
                    WHERE bill_master_id = $2
                `, [totalAmount, masterId]);
            }
        }

        // 4. Create Insurance Claims
        console.log('Creating claims...');
        for (let i = 0; i < 15; i++) {
            const claimDate = getRandomDate(90);
            const amount = 5000 + Math.floor(Math.random() * 20000);
            const status = Math.random() > 0.2 ? 'Approved' : 'Pending';
            const approvedAmt = status === 'Approved' ? amount * 0.9 : 0;
            await client.query(`
                INSERT INTO insurance_claims (
                    branch_id, patient_id, 
                    policy_number, provider_name,
                    claim_amount, approval_amount, pending_amount,
                    status, created_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             `, [
                BRANCH_ID, getRandomItem(patients),
                'POL-' + Math.floor(Math.random() * 10000),
                getRandomItem(['Star Health', 'HDFC Ergo', 'ICICI Lombard']),
                amount, approvedAmt, amount - approvedAmt,
                status, claimDate
            ]);
        }

        await client.query('COMMIT');
        console.log('✅ Seed complete!');

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Seed failed:', e);
    } finally {
        client.release();
    }
}

seedData();
