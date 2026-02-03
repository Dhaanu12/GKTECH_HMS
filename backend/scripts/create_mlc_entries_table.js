const { pool } = require('../config/db');

const createMlcTable = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS mlc_entries (
                mlc_id SERIAL PRIMARY KEY,
                mlc_number VARCHAR(50) UNIQUE NOT NULL,
                opd_id INTEGER REFERENCES opd_entries(opd_id),
                patient_id INTEGER REFERENCES patients(patient_id),
                doctor_id INTEGER REFERENCES doctors(doctor_id),
                branch_id INTEGER REFERENCES branches(branch_id),
                
                police_station VARCHAR(255),
                police_station_district VARCHAR(255),
                brought_by VARCHAR(255),
                
                history_alleged TEXT,
                injury_description TEXT,
                nature_of_injury VARCHAR(100),
                opinion TEXT,
                
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`CREATE INDEX IF NOT EXISTS idx_mlc_opd_id ON mlc_entries(opd_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mlc_patient_id ON mlc_entries(patient_id)`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mlc_mlc_number ON mlc_entries(mlc_number)`);

        await client.query('COMMIT');
        console.log('MLC Entries table check/creation completed successfully');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating MLC table:', error);
    } finally {
        client.release();
        // pool.end(); // Don't close pool if running as part of a larger process, but for standalone script it's fine. 
        // Keeping it consistent with ref.
        process.exit(0);
    }
};

createMlcTable();
