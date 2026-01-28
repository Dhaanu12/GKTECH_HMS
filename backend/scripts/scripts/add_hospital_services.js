const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function addHospitalServices() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📝 Adding 88 hospital services...\n');

        const services = [
            { code: 'SVC-OUTPATIENT593', name: 'Outpatient services', category: 'General' },
            { code: 'SVC-INPATIENTS499', name: 'Inpatient services', category: 'General' },
            { code: 'SVC-EMERGENCYC629', name: 'Emergency care', category: 'General' },
            { code: 'SVC-TRAUMACARE793', name: 'Trauma care', category: 'General' },
            { code: 'SVC-CRITICALCA514', name: 'Critical care', category: 'General' },
            { code: 'SVC-DAYCAREPRO911', name: 'Day care procedures', category: 'General' },
            { code: 'SVC-ADMISSIONS279', name: 'Admission service', category: 'General' },
            { code: 'SVC-DISCHARGES901', name: 'Discharge service', category: 'General' },
            { code: 'SVC-BEDMANAGEM362', name: 'Bed management', category: 'General' },
            { code: 'SVC-PREOPERATI759', name: 'Pre-operative care', category: 'General' },
            { code: 'SVC-POSTOPERAT78', name: 'Post-operative care', category: 'General' },
            { code: 'SVC-VACCINATIO355', name: 'Vaccination service', category: 'General' },
            { code: 'SVC-FOLLOWUPCA804', name: 'Follow-up care', category: 'General' },
            { code: 'SVC-PAINMANAGE894', name: 'Pain management', category: 'General' },
            { code: 'SVC-WOUNDDRESS767', name: 'Wound dressing', category: 'General' },
            { code: 'SVC-LABORATORY479', name: 'Laboratory testing', category: 'General' },
            { code: 'SVC-SAMPLECOLL925', name: 'Sample collection', category: 'General' },
            { code: 'SVC-RADIOLOGYI149', name: 'Radiology imaging', category: 'General' },
            { code: 'SVC-ECG23', name: 'ECG', category: 'General' },
            { code: 'SVC-EEG28', name: 'EEG', category: 'General' },
            { code: 'SVC-EMG89', name: 'EMG', category: 'General' },
            { code: 'SVC-TMTSTRESST749', name: 'TMT / stress test', category: 'General' },
            { code: 'SVC-ENDOSCOPY575', name: 'Endoscopy', category: 'General' },
            { code: 'SVC-COLONOSCOP385', name: 'Colonoscopy', category: 'General' },
            { code: 'SVC-BIOPSY28', name: 'Biopsy', category: 'General' },
            { code: 'SVC-ULTRASOUND255', name: 'Ultrasound scan', category: 'General' },
            { code: 'SVC-XRAYSCAN995', name: 'X-ray scan', category: 'General' },
            { code: 'SVC-CTSCAN722', name: 'CT scan', category: 'General' },
            { code: 'SVC-MRISCAN687', name: 'MRI scan', category: 'General' },
            { code: 'SVC-MAMMOGRAPH717', name: 'Mammography', category: 'General' },
            { code: 'SVC-PETSCAN72', name: 'PET scan', category: 'General' },
            { code: 'SVC-PHYSIOTHER918', name: 'Physiotherapy', category: 'General' },
            { code: 'SVC-OCCUPATION292', name: 'Occupational therapy', category: 'General' },
            { code: 'SVC-SPEECHTHER220', name: 'Speech therapy', category: 'General' },
            { code: 'SVC-RESPIRATOR417', name: 'Respiratory therapy', category: 'General' },
            { code: 'SVC-NUTRITIOND284', name: 'Nutrition & diet counseling', category: 'General' },
            { code: 'SVC-REHABILITA22', name: 'Rehabilitation', category: 'General' },
            { code: 'SVC-DIALYSIS985', name: 'Dialysis', category: 'General' },
            { code: 'SVC-CHEMOTHERA578', name: 'Chemotherapy', category: 'General' },
            { code: 'SVC-RADIOTHERA84', name: 'Radiotherapy', category: 'General' },
            { code: 'SVC-COUNSELING846', name: 'Counseling & psychotherapy', category: 'General' },
            { code: 'SVC-OPPHARMACY347', name: 'OP pharmacy service', category: 'General' },
            { code: 'SVC-IPPHARMACY766', name: 'IP pharmacy service', category: 'General' },
            { code: 'SVC-MEDICINEDI584', name: 'Medicine dispensing', category: 'General' },
            { code: 'SVC-DRUGREFILL49', name: 'Drug refill service', category: 'General' },
            { code: 'SVC-PRESCRIPTI616', name: 'Prescription management', category: 'General' },
            { code: 'SVC-AMBULANCES339', name: 'Ambulance service', category: 'General' },
            { code: 'SVC-MEDICALTRA492', name: 'Medical transport', category: 'General' },
            { code: 'SVC-MOBILECLIN179', name: 'Mobile clinic service', category: 'General' },
            { code: 'SVC-MINORPROCE577', name: 'Minor procedures', category: 'General' },
            { code: 'SVC-MAJORSURGE927', name: 'Major surgeries', category: 'General' },
            { code: 'SVC-LAPAROSCOP727', name: 'Laparoscopic surgery', category: 'General' },
            { code: 'SVC-ENDOSCOPIC704', name: 'Endoscopic surgery', category: 'General' },
            { code: 'SVC-DRESSINGSU188', name: 'Dressing & suturing', category: 'General' },
            { code: 'SVC-ANESTHESIA924', name: 'Anesthesia service', category: 'General' },
            { code: 'SVC-APPOINTMEN148', name: 'Appointment scheduling', category: 'General' },
            { code: 'SVC-QUEUEMANAG316', name: 'Queue management', category: 'General' },
            { code: 'SVC-BILLING929', name: 'Billing', category: 'General' },
            { code: 'SVC-PACKAGEBIL814', name: 'Package billing', category: 'General' },
            { code: 'SVC-INSURANCET715', name: 'Insurance/TPA processing', category: 'General' },
            { code: 'SVC-CORPORATEB488', name: 'Corporate billing', category: 'General' },
            { code: 'SVC-MEDICALREC266', name: 'Medical records (MRD)', category: 'General' },
            { code: 'SVC-TELEMEDICI656', name: 'Telemedicine', category: 'General' },
            { code: 'SVC-CONSULTATI453', name: 'Consultation service', category: 'General' },
            { code: 'SVC-PATIENTFEE195', name: 'Patient feedback', category: 'General' },
            { code: 'SVC-HOUSEKEEPI265', name: 'Housekeeping', category: 'General' },
            { code: 'SVC-LAUNDRY372', name: 'Laundry', category: 'General' },
            { code: 'SVC-SECURITY286', name: 'Security', category: 'General' },
            { code: 'SVC-CAFETERIAD190', name: 'Cafeteria/diet kitchen', category: 'General' },
            { code: 'SVC-BIOMEDICAL173', name: 'Biomedical waste management', category: 'General' },
            { code: 'SVC-FACILITYMA955', name: 'Facility maintenance', category: 'General' },
            { code: 'SVC-EQUIPMENTM894', name: 'Equipment maintenance', category: 'General' },
            { code: 'SVC-PARKINGSER463', name: 'Parking service', category: 'General' },
            { code: 'SVC-RECEPTIONH693', name: 'Reception/helpdesk', category: 'General' },
            { code: 'SVC-CALLCENTER642', name: 'Call center service', category: 'General' },
            { code: 'SVC-ICUCARE878', name: 'ICU care', category: 'General' },
            { code: 'SVC-NICUCARE765', name: 'NICU care', category: 'General' },
            { code: 'SVC-PICUCARE430', name: 'PICU care', category: 'General' },
            { code: 'SVC-SICUCARE185', name: 'SICU care', category: 'General' },
            { code: 'SVC-BURNSUNITC19', name: 'Burns unit care', category: 'General' },
            { code: 'SVC-POISONCENT95', name: 'Poison center service', category: 'General' },
            { code: 'SVC-BLOODBANKS162', name: 'Blood bank service', category: 'General' },
            { code: 'SVC-ORGANDONAT725', name: 'Organ donation support', category: 'General' },
            { code: 'SVC-HEALTHCAMP213', name: 'Health camps', category: 'General' },
            { code: 'SVC-HEALTHSCRE537', name: 'Health screenings', category: 'General' },
            { code: 'SVC-WELLNESSPR393', name: 'Wellness programs', category: 'General' },
            { code: 'SVC-PREVENTIVE11', name: 'Preventive health checkups', category: 'General' },
            { code: 'SVC-PUBLICAWAR724', name: 'Public awareness programs', category: 'General' }
        ];

        let count = 0;

        for (const service of services) {
            // Check if service already exists
            const existing = await client.query(
                'SELECT hosp_service_id FROM hospital_services WHERE service_code = $1',
                [service.code]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  Skipped: ${service.name} (already exists)`);
                continue;
            }

            const result = await client.query(
                `INSERT INTO hospital_services (
                    service_code, service_name, is_active, status
                ) VALUES ($1, $2, $3, $4)
                RETURNING hosp_service_id`,
                [
                    service.code,
                    service.name,
                    true,
                    'Active'
                ]
            );

            count++;
            console.log(`✅ Added: ${service.name} - ID: ${result.rows[0].hosp_service_id}`);
        }

        await client.query('COMMIT');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully added ${count} hospital services`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error adding services:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

addHospitalServices();
