const db = require('../config/db');

async function seedPatients() {
    const client = await db.getClient();
    try {
        await client.query('BEGIN');

        const doctorId = 44;
        const branchId = 7;
        const receptionistId = 25;

        const patients = [
            { first: 'Rahul', last: 'Sharma', age: 28, gender: 'Male', isMlc: true },
            { first: 'Priya', last: 'Verma', age: 24, gender: 'Female', isMlc: true },
            { first: 'Amit', last: 'Patel', age: 45, gender: 'Male', isMlc: true },
            { first: 'Suresh', last: 'Raina', age: 36, gender: 'Male', isMlc: false },
            { first: 'Deepa', last: 'Nair', age: 31, gender: 'Female', isMlc: false },
            { first: 'Vikram', last: 'Singh', age: 29, gender: 'Male', isMlc: false },
            { first: 'Anjali', last: 'Gupta', age: 27, gender: 'Female', isMlc: false },
            { first: 'Karthik', last: 'Subbaraj', age: 40, gender: 'Male', isMlc: false },
            { first: 'Laxmi', last: 'Priya', age: 52, gender: 'Female', isMlc: false },
            { first: 'Mohit', last: 'Chauhan', age: 33, gender: 'Male', isMlc: false }
        ];

        for (let i = 0; i < patients.length; i++) {
            const p = patients[i];
            const timestamp = Date.now() + i;
            const mrn = `MRN-20260212-${1000 + i}`;
            const pCode = `PAT-${timestamp}`;
            const opdNumber = `OPD-20260212-${5000 + i}`;

            // Insert Patient
            const patientRes = await client.query(`
                INSERT INTO patients (
                    mrn_number, patient_code, first_name, last_name, age, gender, 
                    contact_number, registration_date, blood_group, is_active
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_DATE, $8, true)
                RETURNING patient_id
            `, [
                mrn, pCode, p.first, p.last, p.age, p.gender,
                `90000000${i}`, 'O+'
            ]);

            const patientId = patientRes.rows[0].patient_id;

            // Insert OPD Entry
            await client.query(`
                INSERT INTO opd_entries (
                    opd_number, patient_id, branch_id, doctor_id, 
                    visit_type, visit_date, visit_time, token_number,
                    reason_for_visit, chief_complaint, consultation_fee,
                    payment_status, visit_status, checked_in_by, 
                    checked_in_time, is_mlc
                ) VALUES ($1, $2, $3, $4, $5, CURRENT_DATE, CURRENT_TIME, $6, $7, $8, $9, $10, $11, $12, CURRENT_TIMESTAMP, $13)
            `, [
                opdNumber, patientId, branchId, doctorId,
                'Walk-in', `T-${100 + i}`, 'General Checkup', 'Checkup', 500,
                'Paid', 'Registered', receptionistId, p.isMlc
            ]);

            console.log(`✅ Created patient ${p.first} ${p.last} (MLC: ${p.isMlc})`);
        }

        await client.query('COMMIT');
        console.log('\n🌟 All 10 patients created successfully for Doctor Vimal.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding data:', e);
    } finally {
        client.release();
        process.exit(0);
    }
}

seedPatients();
