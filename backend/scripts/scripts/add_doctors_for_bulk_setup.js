const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function addDoctorsWithoutPercentages() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📝 Adding 15 referral doctors WITHOUT service percentages...\n');

        const doctors = [
            { name: 'Dr. Ramesh Verma', specialty: 'ENT Specialist', mobile: '9876543220' },
            { name: 'Dr. Lakshmi Nair', specialty: 'Ophthalmologist', mobile: '9876543221' },
            { name: 'Dr. Karthik Reddy', specialty: 'Urologist', mobile: '9876543222' },
            { name: 'Dr. Pooja Joshi', specialty: 'Psychiatrist', mobile: '9876543223' },
            { name: 'Dr. Sanjay Kapoor', specialty: 'Gastroenterologist', mobile: '9876543224' },
            { name: 'Dr. Divya Menon', specialty: 'Endocrinologist', mobile: '9876543225' },
            { name: 'Dr. Arun Kumar', specialty: 'Pulmonologist', mobile: '9876543226' },
            { name: 'Dr. Nisha Patel', specialty: 'Rheumatologist', mobile: '9876543227' },
            { name: 'Dr. Manoj Singh', specialty: 'Nephrologist', mobile: '9876543228' },
            { name: 'Dr. Swati Sharma', specialty: 'Hematologist', mobile: '9876543229' },
            { name: 'Dr. Vijay Rao', specialty: 'Oncologist', mobile: '9876543230' },
            { name: 'Dr. Anjali Deshmukh', specialty: 'Allergist', mobile: '9876543231' },
            { name: 'Dr. Prakash Iyer', specialty: 'Anesthesiologist', mobile: '9876543232' },
            { name: 'Dr. Rekha Pillai', specialty: 'Emergency Medicine', mobile: '9876543233' },
            { name: 'Dr. Harish Bhat', specialty: 'Sports Medicine', mobile: '9876543234' }
        ];

        let count = 0;

        for (const doctor of doctors) {
            const result = await client.query(
                `INSERT INTO referral_doctor (
                    doctor_name, speciality_type, mobile_number,
                    bank_account_number, bank_ifsc_code, pan_card_number, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
                RETURNING id`,
                [
                    doctor.name,
                    doctor.specialty,
                    doctor.mobile,
                    `ACC${Math.floor(Math.random() * 1000000000000000)}`,
                    `BANK${Math.floor(Math.random() * 1000000)}`,
                    `PAN${Math.floor(Math.random() * 10000)}X`
                ]
            );

            count++;
            console.log(`✅ Added: ${doctor.name} (${doctor.specialty}) - ID: ${result.rows[0].id}`);
        }

        await client.query('COMMIT');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully added ${count} doctors WITHOUT service percentages`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        console.log('These doctors are ready for bulk setup!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding doctors:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addDoctorsWithoutPercentages();
