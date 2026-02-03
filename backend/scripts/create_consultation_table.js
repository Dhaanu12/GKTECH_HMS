const { query } = require('../config/db');

async function createTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS consultation_outcomes (
                outcome_id SERIAL PRIMARY KEY,
                opd_id INTEGER REFERENCES opd_entries(opd_id),
                patient_id INTEGER REFERENCES patients(patient_id),
                doctor_id INTEGER REFERENCES doctors(doctor_id),
                prescription_id INTEGER REFERENCES prescriptions(prescription_id),
                consultation_status VARCHAR(50) DEFAULT 'Completed', -- e.g., Completed, Referred, Admitted
                diagnosis TEXT,
                notes TEXT,
                next_visit_date DATE,
                next_visit_status VARCHAR(100), -- e.g., Follow-up Required, Not Necessary
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Consultation outcomes table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

createTable();
