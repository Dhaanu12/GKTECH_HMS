
const { pool } = require('./config/db');

(async () => {
    try {
        console.log('Creating "prescriptions" table if not exists...');
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS prescriptions (
                prescription_id SERIAL PRIMARY KEY,
                opd_id INT NOT NULL,
                patient_id INT NOT NULL,
                doctor_id INT NOT NULL,
                medicine_name VARCHAR(255) NOT NULL,
                dosage VARCHAR(100),
                frequency VARCHAR(100),
                duration VARCHAR(100),
                food_timing VARCHAR(100),
                instructions TEXT,
                status VARCHAR(50) DEFAULT 'Pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (opd_id) REFERENCES opd_entries(opd_id) ON DELETE CASCADE,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE,
                FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL
            );
        `;
        await pool.query(createTableQuery);
        console.log('✅ "prescriptions" table created/verified.');

        // Add index for performance
        await pool.query('CREATE INDEX IF NOT EXISTS idx_prescriptions_opd ON prescriptions(opd_id);');
        console.log('✅ Index created.');

    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        await pool.end();
    }
})();
