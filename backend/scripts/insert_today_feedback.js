const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_database_beta',
    password: process.env.DB_PASSWORD || 'root',
    port: process.env.DB_PORT || 5432,
});

async function run() {
    const client = await pool.connect();
    try {
        const mrn = 'MRN-20260213-0002';
        console.log(`Processing for MRN: ${mrn}`);

        // 1. Get Patient Details
        const patientRes = await client.query('SELECT * FROM patients WHERE mrn_number = $1', [mrn]);
        if (patientRes.rows.length === 0) {
            console.log('Patient not found!');
            return;
        }
        const patient = patientRes.rows[0];
        console.log(`Found Patient: ${patient.first_name} ${patient.last_name}`);

        // 2. Generate OPD Number
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}${mm}${dd}`;
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(4, '0');
        const opdNumber = `OPD-${dateStr}-${randomNum}`;
        console.log(`Generated OPD Number: ${opdNumber}`);

        // 3. Create NEW OPD Entry for TODAY
        const insertOpdQuery = `
            INSERT INTO opd_entries 
            (opd_number, patient_id, doctor_id, visit_date, visit_time, visit_type, consultation_fee, payment_status, payment_method, branch_id, visit_status, created_at, updated_at)
            VALUES ($1, $2, $3, CURRENT_DATE, '10:00', 'Walk-in', 500, 'Paid', 'Cash', $4, 'Completed', NOW(), NOW())
            RETURNING opd_id, visit_date
        `;

        // Check if doctor exists first
        // const docRes = await client.query('SELECT doctor_id FROM doctors LIMIT 1');
        // const doctor_id = docRes.rows.length > 0 ? docRes.rows[0].doctor_id : 1;
        const doctor_id = 39; // Dr. Anju (from debug output)
        const branch_id = 55; // Valid branch from debug output

        const opdRes = await client.query(insertOpdQuery, [opdNumber, patient.patient_id, doctor_id, branch_id]);
        const opd = opdRes.rows[0];
        console.log(`Created new OPD Visit for TODAY. ID: ${opd.opd_id}, Date: ${opd.visit_date}`);

        // 4. Insert Feedback linked to this new OPD entry
        const feedbackQuery = `
            INSERT INTO patient_feedback 
            (patient_id, patient_name, mrn, service_context, rating, tags, comment, nurse_id, sentiment, branch_id, opd_id, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW()) 
            RETURNING *
        `;

        const values = [
            patient.patient_id,
            `${patient.first_name} ${patient.last_name}`,
            mrn,
            'OPD Consultation',
            5,
            JSON.stringify(['Friendly Staff', 'Efficient']),
            'Great experience today! Validation record.',
            1,
            'Positive',
            branch_id,
            opd.opd_id
        ];

        const fbRes = await client.query(feedbackQuery, values);
        console.log('Feedback inserted successfully for TODAY:', fbRes.rows[0]);

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
