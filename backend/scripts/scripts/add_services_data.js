const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function addServices() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        console.log('📝 Adding 88 services...\n');

        const services = [
            { id: 1, code: 'SVC-OUTPATIENT593', name: 'Outpatient services', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 2, code: 'SVC-INPATIENTS499', name: 'Inpatient services', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 3, code: 'SVC-EMERGENCYC629', name: 'Emergency care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 4, code: 'SVC-TRAUMACARE793', name: 'Trauma care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 5, code: 'SVC-CRITICALCA514', name: 'Critical care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 6, code: 'SVC-DAYCAREPRO911', name: 'Day care procedures', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 7, code: 'SVC-ADMISSIONS279', name: 'Admission service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 8, code: 'SVC-DISCHARGES901', name: 'Discharge service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 9, code: 'SVC-BEDMANAGEM362', name: 'Bed management', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 10, code: 'SVC-PREOPERATI759', name: 'Pre-operative care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 11, code: 'SVC-POSTOPERAT78', name: 'Post-operative care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 12, code: 'SVC-VACCINATIO355', name: 'Vaccination service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 13, code: 'SVC-FOLLOWUPCA804', name: 'Follow-up care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 14, code: 'SVC-PAINMANAGE894', name: 'Pain management', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 15, code: 'SVC-WOUNDDRESS767', name: 'Wound dressing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 16, code: 'SVC-LABORATORY479', name: 'Laboratory testing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 17, code: 'SVC-SAMPLECOLL925', name: 'Sample collection', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 18, code: 'SVC-RADIOLOGYI149', name: 'Radiology imaging', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 19, code: 'SVC-ECG23', name: 'ECG', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 20, code: 'SVC-EEG28', name: 'EEG', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 21, code: 'SVC-EMG89', name: 'EMG', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 22, code: 'SVC-TMTSTRESST749', name: 'TMT / stress test', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 23, code: 'SVC-ENDOSCOPY575', name: 'Endoscopy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 24, code: 'SVC-COLONOSCOP385', name: 'Colonoscopy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 25, code: 'SVC-BIOPSY28', name: 'Biopsy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 26, code: 'SVC-ULTRASOUND255', name: 'Ultrasound scan', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 27, code: 'SVC-XRAYSCAN995', name: 'X-ray scan', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 28, code: 'SVC-CTSCAN722', name: 'CT scan', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 29, code: 'SVC-MRISCAN687', name: 'MRI scan', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 30, code: 'SVC-MAMMOGRAPH717', name: 'Mammography', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 31, code: 'SVC-PETSCAN72', name: 'PET scan', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 32, code: 'SVC-PHYSIOTHER918', name: 'Physiotherapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 33, code: 'SVC-OCCUPATION292', name: 'Occupational therapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 34, code: 'SVC-SPEECHTHER220', name: 'Speech therapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 35, code: 'SVC-RESPIRATOR417', name: 'Respiratory therapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 36, code: 'SVC-NUTRITIOND284', name: 'Nutrition & diet counseling', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 37, code: 'SVC-REHABILITA22', name: 'Rehabilitation', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 38, code: 'SVC-DIALYSIS985', name: 'Dialysis', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 39, code: 'SVC-CHEMOTHERA578', name: 'Chemotherapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 40, code: 'SVC-RADIOTHERA84', name: 'Radiotherapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 41, code: 'SVC-COUNSELING846', name: 'Counseling & psychotherapy', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 42, code: 'SVC-OPPHARMACY347', name: 'OP pharmacy service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 43, code: 'SVC-IPPHARMACY766', name: 'IP pharmacy service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 44, code: 'SVC-MEDICINEDI584', name: 'Medicine dispensing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 45, code: 'SVC-DRUGREFILL49', name: 'Drug refill service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 46, code: 'SVC-PRESCRIPTI616', name: 'Prescription management', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 47, code: 'SVC-AMBULANCES339', name: 'Ambulance service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 48, code: 'SVC-MEDICALTRA492', name: 'Medical transport', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 49, code: 'SVC-MOBILECLIN179', name: 'Mobile clinic service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 50, code: 'SVC-MINORPROCE577', name: 'Minor procedures', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 51, code: 'SVC-MAJORSURGE927', name: 'Major surgeries', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 52, code: 'SVC-LAPAROSCOP727', name: 'Laparoscopic surgery', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 53, code: 'SVC-ENDOSCOPIC704', name: 'Endoscopic surgery', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 54, code: 'SVC-DRESSINGSU188', name: 'Dressing & suturing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 55, code: 'SVC-ANESTHESIA924', name: 'Anesthesia service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 56, code: 'SVC-APPOINTMEN148', name: 'Appointment scheduling', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 57, code: 'SVC-QUEUEMANAG316', name: 'Queue management', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 58, code: 'SVC-BILLING929', name: 'Billing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 59, code: 'SVC-PACKAGEBIL814', name: 'Package billing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 60, code: 'SVC-INSURANCET715', name: 'Insurance/TPA processing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 61, code: 'SVC-CORPORATEB488', name: 'Corporate billing', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 62, code: 'SVC-MEDICALREC266', name: 'Medical records (MRD)', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 63, code: 'SVC-TELEMEDICI656', name: 'Telemedicine', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 64, code: 'SVC-CONSULTATI453', name: 'Consultation service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 65, code: 'SVC-PATIENTFEE195', name: 'Patient feedback', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 66, code: 'SVC-HOUSEKEEPI265', name: 'Housekeeping', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 67, code: 'SVC-LAUNDRY372', name: 'Laundry', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 68, code: 'SVC-SECURITY286', name: 'Security', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 69, code: 'SVC-CAFETERIAD190', name: 'Cafeteria/diet kitchen', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 70, code: 'SVC-BIOMEDICAL173', name: 'Biomedical waste management', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 71, code: 'SVC-FACILITYMA955', name: 'Facility maintenance', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 72, code: 'SVC-EQUIPMENTM894', name: 'Equipment maintenance', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 73, code: 'SVC-PARKINGSER463', name: 'Parking service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 74, code: 'SVC-RECEPTIONH693', name: 'Reception/helpdesk', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 75, code: 'SVC-CALLCENTER642', name: 'Call center service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 76, code: 'SVC-ICUCARE878', name: 'ICU care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 77, code: 'SVC-NICUCARE765', name: 'NICU care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 78, code: 'SVC-PICUCARE430', name: 'PICU care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 79, code: 'SVC-SICUCARE185', name: 'SICU care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 80, code: 'SVC-BURNSUNITC19', name: 'Burns unit care', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 81, code: 'SVC-POISONCENT95', name: 'Poison center service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 82, code: 'SVC-BLOODBANKS162', name: 'Blood bank service', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 83, code: 'SVC-ORGANDONAT725', name: 'Organ donation support', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 84, code: 'SVC-HEALTHCAMP213', name: 'Health camps', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 85, code: 'SVC-HEALTHSCRE537', name: 'Health screenings', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 86, code: 'SVC-WELLNESSPR393', name: 'Wellness programs', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 87, code: 'SVC-PREVENTIVE11', name: 'Preventive health checkups', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true },
            { id: 88, code: 'SVC-PUBLICAWAR724', name: 'Public awareness programs', description: 'NULL', category: 'General', price: 0, hsn: 'NULL', taxable: true, active: true }
        ];

        let count = 0;

        for (const service of services) {
            // Check if service already exists
            const existing = await client.query(
                'SELECT service_id FROM services WHERE service_code = $1',
                [service.code]
            );

            if (existing.rows.length > 0) {
                console.log(`⏭️  Skipped: ${service.name} (already exists)`);
                continue;
            }

            const result = await client.query(
                `INSERT INTO services (
                    service_code, service_name, description, service_category,
                    default_unit_price, hsn_code, is_taxable, is_active,
                    created_at, updated_at
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                RETURNING service_id`,
                [
                    service.code,
                    service.name,
                    service.description === 'NULL' ? null : service.description,
                    service.category,
                    service.price,
                    service.hsn === 'NULL' ? null : service.hsn,
                    service.taxable,
                    service.active
                ]
            );

            count++;
            console.log(`✅ Added: ${service.name} - ID: ${result.rows[0].service_id}`);
        }

        await client.query('COMMIT');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`✅ Successfully added ${count} services`);
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

addServices();
