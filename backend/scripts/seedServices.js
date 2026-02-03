const { pool } = require('../config/db');
require('dotenv').config({ path: '../.env' }); // Ensure env vars are loaded if db.js relies on them immediately


const servicesList = [
    "Outpatient services", "Inpatient services", "Emergency care", "Trauma care", "Critical care",
    "Day care procedures", "Admission service", "Discharge service", "Bed management", "Pre-operative care",
    "Post-operative care", "Vaccination service", "Follow-up care", "Pain management", "Wound dressing",
    "Laboratory testing", "Sample collection", "Radiology imaging", "ECG", "EEG", "EMG",
    "TMT / stress test", "Endoscopy", "Colonoscopy", "Biopsy", "Ultrasound scan", "X-ray scan",
    "CT scan", "MRI scan", "Mammography", "PET scan", "Physiotherapy", "Occupational therapy",
    "Speech therapy", "Respiratory therapy", "Nutrition & diet counseling", "Rehabilitation", "Dialysis",
    "Chemotherapy", "Radiotherapy", "Counseling & psychotherapy", "OP pharmacy service", "IP pharmacy service",
    "Medicine dispensing", "Drug refill service", "Prescription management", "Ambulance service",
    "Medical transport", "Mobile clinic service", "Minor procedures", "Major surgeries",
    "Laparoscopic surgery", "Endoscopic surgery", "Dressing & suturing", "Anesthesia service",
    "Appointment scheduling", "Queue management", "Billing", "Package billing", "Insurance/TPA processing",
    "Corporate billing", "Medical records (MRD)", "Telemedicine", "Consultation service", "Patient feedback",
    "Housekeeping", "Laundry", "Security", "Cafeteria/diet kitchen", "Biomedical waste management",
    "Facility maintenance", "Equipment maintenance", "Parking service", "Reception/helpdesk",
    "Call center service", "ICU care", "NICU care", "PICU care", "SICU care", "Burns unit care",
    "Poison center service", "Blood bank service", "Organ donation support", "Health camps",
    "Health screenings", "Wellness programs", "Preventive health checkups", "Public awareness programs"
];

async function seedServices() {
    const client = await pool.connect();
    try {
        console.log('Connected to database...');
        await client.query('BEGIN');

        // Optional: Clear existing services or check for duplicates
        // For now, we'll INSERT ON CONFLICT DO NOTHING based on service_code or name
        // Since we generate codes, we'll check by name or just insert.
        // Let's assume we want to ensure these exist.

        for (const serviceName of servicesList) {
            // Generate a code: SVC-UPPERCASE_NAME (truncated)
            const code = 'SVC-' + serviceName.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 10) + Math.floor(Math.random() * 1000);

            // Check if service with same name exists to avoid duplicates if re-run
            const checkRes = await client.query('SELECT service_id FROM services WHERE service_name = $1', [serviceName]);

            if (checkRes.rows.length === 0) {
                await client.query(`
                    INSERT INTO services (service_code, service_name, service_category, default_unit_price, is_active)
                    VALUES ($1, $2, 'General', 0.00, true)
                `, [code, serviceName]);
                console.log(`Inserted: ${serviceName}`);
            } else {
                console.log(`Skipped (already exists): ${serviceName}`);
            }
        }

        await client.query('COMMIT');
        console.log('Seeding completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error seeding services:', error);
    } finally {
        client.release();
        pool.end();
    }
}

seedServices();
