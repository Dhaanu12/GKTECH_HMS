const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function run() {
    const client = await pool.connect();
    try {
        const mrn = 'MRN-20260213-0002';
        console.log(`Looking for patient with MRN: ${mrn}`);

        // 1. Get Patient Details
        const patientRes = await client.query('SELECT * FROM patients WHERE mrn_number = $1', [mrn]);
        if (patientRes.rows.length === 0) {
            console.log('Patient not found!');
            return;
        }
        const patient = patientRes.rows[0];
        console.log(`Found Patient: ${patient.first_name} ${patient.last_name} (ID: ${patient.patient_id})`);

        // 2. Get OPD Visit (Today's visit ideally, or recent)
        const opdRes = await client.query(`
            SELECT * FROM opd_entries 
            WHERE patient_id = $1 
            ORDER BY visit_date DESC LIMIT 1
        `, [patient.patient_id]);

        let opd_id = null;
        if (opdRes.rows.length > 0) {
            const opd = opdRes.rows[0];
            opd_id = opd.opd_id;
            console.log(`Found OPD Visit ID: ${opd_id} Date: ${opd.visit_date}`);
        } else {
            console.log('No OPD entry found for this patient.');
            // Should I create one? The user said "their OPD was registered today tho!!"
            // If not found, maybe I should check by name if MRN is mismatched? 
            // But user gave specific MRN.
        }

        // 3. Insert Feedback
        if (opd_id) {
            const feedbackQuery = `
                INSERT INTO patient_feedback 
                (patient_id, patient_name, mrn, service_context, rating, tags, comment, nurse_id, sentiment, branch_id, opd_id) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) 
                RETURNING *
            `;
            const values = [
                patient.patient_id,
                `${patient.first_name} ${patient.last_name}`,
                mrn,
                'OPD Consultation',
                5,
                JSON.stringify(['Friendly Staff', 'Quick Service']),
                'Very quick and detailed consultation. The doctor was very verified.',
                1, // Assuming admin/system user ID 1 exists
                'Positive',
                1, // Assuming branch_id 1
                opd_id
            ];

            const res = await client.query(feedbackQuery, values);
            console.log('Feedback inserted successfully:', res.rows[0]);
        }

    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        pool.end();
    }
}

run();
