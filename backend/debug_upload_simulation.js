const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function run() {
    const client = await pool.connect();
    try {
        console.log('--- Simulating Upload ---');

        // Mock User (Hospital 6 for Sunshine, based on previous debug)
        const hospital_id = 6;
        const branch_id = 1; // Assume generic branch
        const created_by = 1;

        // Mock Data
        const data = [
            {
                'PATIENT NAME': 'Test Patient',
                'ADMISSION TYPE': 'OPD',
                'DEPARTMENT': 'General',
                'DOCTOR NAME': 'Dr. Test',
                'MEDICAL COUNCIL ID': 'MCI-TEST',
                'PAYMENT MODE': 'Cash',
                'Consultation': 500, // Service Column
                'X-Ray': 0
            }
        ];

        console.log('Inserting Batch...');
        const batchResult = await client.query(
            `INSERT INTO referral_payment_upload_batch 
            (hospital_id, branch_id, file_name, total_records, created_by, updated_by)
            VALUES ($1, $2, $3, $4, $5, $5) RETURNING id`,
            [hospital_id, branch_id, 'debug_test.xlsx', data.length, created_by]
        );
        const batchId = batchResult.rows[0].id;
        console.log('Batch ID:', batchId);

        console.log('Fetching Services...');
        const servicesQuery = await client.query(
            `SELECT service_name, service_code 
             FROM hospital_services 
             WHERE hospital_id = $1 AND is_active = true`,
            [hospital_id]
        );
        const serviceCodeMap = {};
        servicesQuery.rows.forEach(r => {
            serviceCodeMap[r.service_name] = r.service_code;
        });
        console.log('Service Map:', serviceCodeMap);

        for (const row of data) {
            console.log('Processing Row:', row);
            const patientName = row['PATIENT NAME'];
            const doctorName = row['DOCTOR NAME'];
            const mciId = row['MEDICAL COUNCIL ID'];
            const paymentMode = row['PAYMENT MODE'];
            const admissionType = row['ADMISSION TYPE'];
            const department = row['DEPARTMENT'];

            const headerResult = await client.query(
                `INSERT INTO referral_payment_header 
                (batch_id, patient_name, admission_type, department, doctor_name, medical_council_id, payment_mode, created_by, updated_by)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8) RETURNING id`,
                [batchId, patientName, admissionType, department, doctorName, mciId, paymentMode, created_by]
            );
            const headerId = headerResult.rows[0].id;
            console.log('Header Created:', headerId);

            // Fetch Doctor
            const doctorQuery = await client.query(
                "SELECT id, referral_pay FROM referral_doctor_module WHERE medical_council_membership_number = $1",
                [mciId]
            );

            let doctorId = null;
            if (doctorQuery.rows.length > 0) {
                doctorId = doctorQuery.rows[0].id;
            }
            console.log('Doctor Found:', doctorId);

            let doctorServicePercentages = {};
            if (doctorId) {
                const pctQuery = await client.query(
                    "SELECT service_type, cash_percentage, inpatient_percentage FROM referral_doctor_service_percentage_module WHERE referral_doctor_id = $1",
                    [doctorId]
                );
                pctQuery.rows.forEach(r => {
                    doctorServicePercentages[r.service_type] = {
                        cash: Number(r.cash_percentage),
                        ipd: Number(r.inpatient_percentage)
                    };
                });
            }

            const staticKeys = ['PATIENT NAME', 'ADMISSION TYPE', 'DEPARTMENT', 'DOCTOR NAME', 'MEDICAL COUNCIL ID', 'PAYMENT MODE'];

            for (const key of Object.keys(row)) {
                if (staticKeys.includes(key)) continue;

                const serviceName = key;
                const value = row[key];

                // --- THE LOGIC I MODIFIED ---
                const serviceCost = Number(value);
                if (!serviceCost || serviceCost <= 0) continue;

                const serviceCode = serviceCodeMap[serviceName];
                console.log(`Service: ${serviceName}, Code: ${serviceCode}, Cost: ${serviceCost}`);

                let percentage = 0;
                if (doctorId && serviceCode && doctorServicePercentages[serviceCode]) {
                    if (paymentMode && paymentMode.toLowerCase() === 'cash') {
                        percentage = doctorServicePercentages[serviceCode].cash || 0;
                    } else {
                        percentage = doctorServicePercentages[serviceCode].ipd || 0;
                    }
                }

                const referralAmount = (serviceCost * percentage) / 100;
                console.log(`Referral Amount: ${referralAmount}`);

                await client.query(
                    `INSERT INTO referral_payment_details
                    (payment_header_id, service_name, service_cost, referral_percentage, referral_amount, created_by, updated_by)
                    VALUES ($1, $2, $3, $4, $5, $6, $6)`,
                    [headerId, serviceName, serviceCost, percentage, referralAmount, created_by]
                );
            }
        }
        console.log('Success!');

    } catch (error) {
        console.error('CRASHED:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

run();
