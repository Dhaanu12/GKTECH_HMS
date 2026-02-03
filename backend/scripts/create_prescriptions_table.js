const { query } = require('../config/db');

async function createTable() {
    try {
        await query(`
            CREATE TABLE IF NOT EXISTS prescriptions (
                prescription_id SERIAL PRIMARY KEY, 
                doctor_id INTEGER REFERENCES doctors(doctor_id), 
                patient_id INTEGER REFERENCES patients(patient_id), 
                branch_id INTEGER REFERENCES branches(branch_id), 
                medications TEXT, 
                notes TEXT, 
                diagnosis TEXT, 
                status VARCHAR(50) DEFAULT 'Active', 
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Prescriptions table created successfully');
    } catch (error) {
        console.error('Error creating table:', error);
    } finally {
        process.exit();
    }
}

createTable();
