const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function addReferralDoctors() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📝 Adding sample referral doctors...\n');

        // Sample doctors data
        const doctors = [
            {
                doctor_name: 'Dr. Rajesh Kumar',
                speciality_type: 'Cardiologist',
                mobile_number: '9876543210',
                bank_account_number: '1234567890123456',
                bank_ifsc_code: 'SBIN0001234',
                pan_card_number: 'ABCDE1234F',
                services: [
                    { service_type: 'CARD-ECG', cash: 12, inpatient: 10, referral_pay: 'Y' },
                    { service_type: 'OPD-GEN', cash: 8, inpatient: 6, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Priya Sharma',
                speciality_type: 'Dermatologist',
                mobile_number: '9876543211',
                bank_account_number: '2345678901234567',
                bank_ifsc_code: 'HDFC0001234',
                pan_card_number: 'BCDEF2345G',
                services: [
                    { service_type: 'CONS-SPECIAL', cash: 15, inpatient: 12, referral_pay: 'Y' },
                    { service_type: 'OPD-GEN', cash: 10, inpatient: 8, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Amit Patel',
                speciality_type: 'Orthopedic',
                mobile_number: '9876543212',
                bank_account_number: '3456789012345678',
                bank_ifsc_code: 'ICIC0001234',
                pan_card_number: 'CDEFG3456H',
                services: [
                    { service_type: 'SURG-MINOR', cash: 20, inpatient: 18, referral_pay: 'Y' },
                    { service_type: 'RAD-XRAY-CHEST', cash: 10, inpatient: 8, referral_pay: 'Y' },
                    { service_type: 'REHAB-PHYSIO', cash: 12, inpatient: 10, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Sneha Reddy',
                speciality_type: 'Pediatrician',
                mobile_number: '9876543213',
                bank_account_number: '4567890123456789',
                bank_ifsc_code: 'AXIS0001234',
                pan_card_number: 'DEFGH4567I',
                services: [
                    { service_type: 'OPD-GEN', cash: 12, inpatient: 10, referral_pay: 'Y' },
                    { service_type: 'LAB-CBC', cash: 8, inpatient: 6, referral_pay: 'Y' },
                    { service_type: 'NURS-INJ', cash: 5, inpatient: 4, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Vikram Singh',
                speciality_type: 'Radiologist',
                mobile_number: '9876543214',
                bank_account_number: '5678901234567890',
                bank_ifsc_code: 'SBIN0005678',
                pan_card_number: 'EFGHI5678J',
                services: [
                    { service_type: 'RAD-XRAY-CHEST', cash: 15, inpatient: 12, referral_pay: 'Y' },
                    { service_type: 'RAD-USG', cash: 18, inpatient: 15, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Kavita Desai',
                speciality_type: 'Gynecologist',
                mobile_number: '9876543215',
                bank_account_number: '6789012345678901',
                bank_ifsc_code: 'HDFC0005678',
                pan_card_number: 'FGHIJ6789K',
                services: [
                    { service_type: 'CONS-SPECIAL', cash: 18, inpatient: 15, referral_pay: 'Y' },
                    { service_type: 'RAD-USG', cash: 12, inpatient: 10, referral_pay: 'Y' },
                    { service_type: 'LAB-BLOOD', cash: 8, inpatient: 6, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Arjun Mehta',
                speciality_type: 'Dentist',
                mobile_number: '9876543216',
                bank_account_number: '7890123456789012',
                bank_ifsc_code: 'ICIC0005678',
                pan_card_number: 'GHIJK7890L',
                services: [
                    { service_type: 'DENT-CLEAN', cash: 20, inpatient: 0, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Meera Iyer',
                speciality_type: 'Pathologist',
                mobile_number: '9876543217',
                bank_account_number: '8901234567890123',
                bank_ifsc_code: 'AXIS0005678',
                pan_card_number: 'HIJKL8901M',
                services: [
                    { service_type: 'LAB-CBC', cash: 10, inpatient: 8, referral_pay: 'Y' },
                    { service_type: 'LAB-BLOOD', cash: 12, inpatient: 10, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Suresh Nair',
                speciality_type: 'Neurologist',
                mobile_number: '9876543218',
                bank_account_number: '9012345678901234',
                bank_ifsc_code: 'SBIN0009012',
                pan_card_number: 'IJKLM9012N',
                services: [
                    { service_type: 'CONS-SPECIAL', cash: 20, inpatient: 18, referral_pay: 'Y' },
                    { service_type: 'CARD-ECG', cash: 10, inpatient: 8, referral_pay: 'Y' }
                ]
            },
            {
                doctor_name: 'Dr. Anita Gupta',
                speciality_type: 'General Physician',
                mobile_number: '9876543219',
                bank_account_number: '0123456789012345',
                bank_ifsc_code: 'HDFC0009012',
                pan_card_number: 'JKLMN0123O',
                services: [
                    { service_type: 'CONS-GP', cash: 10, inpatient: 8, referral_pay: 'Y' },
                    { service_type: 'OPD-GEN', cash: 8, inpatient: 6, referral_pay: 'Y' },
                    { service_type: 'EMERG-ER', cash: 15, inpatient: 12, referral_pay: 'Y' }
                ]
            }
        ];

        let doctorCount = 0;
        let serviceCount = 0;

        for (const doctor of doctors) {
            // Insert doctor
            const doctorResult = await client.query(
                `INSERT INTO referral_doctor (
                    doctor_name, speciality_type, mobile_number,
                    bank_account_number, bank_ifsc_code, pan_card_number, status
                ) VALUES ($1, $2, $3, $4, $5, $6, 'Active')
                RETURNING id`,
                [
                    doctor.doctor_name,
                    doctor.speciality_type,
                    doctor.mobile_number,
                    doctor.bank_account_number,
                    doctor.bank_ifsc_code,
                    doctor.pan_card_number
                ]
            );

            const doctorId = doctorResult.rows[0].id;
            doctorCount++;
            console.log(`✅ Added: ${doctor.doctor_name} (${doctor.speciality_type})`);

            // Insert service percentages
            for (const service of doctor.services) {
                await client.query(
                    `INSERT INTO referral_doctor_service_percentage_module (
                        referral_doctor_id, service_type, cash_percentage,
                        inpatient_percentage, referral_pay, status
                    ) VALUES ($1, $2, $3, $4, $5, 'Active')`,
                    [
                        doctorId,
                        service.service_type,
                        service.cash,
                        service.inpatient,
                        service.referral_pay
                    ]
                );
                serviceCount++;
                console.log(`   → ${service.service_type}: Cash ${service.cash}%, Inpatient ${service.inpatient}%`);
            }
            console.log('');
        }

        await client.query('COMMIT');

        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully added ${doctorCount} referral doctors`);
        console.log(`✅ Successfully added ${serviceCount} service configurations`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding referral doctors:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addReferralDoctors();
