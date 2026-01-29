const db = require('./config/db');

const up = async () => {
    try {
        console.log('Creating patient_feedback table...');
        // Check if table exists first to avoid error if script run multiple times without IF NOT EXISTS covering everything (though IF NOT EXISTS is good)
        await db.query(`
            CREATE TABLE IF NOT EXISTS patient_feedback (
                id SERIAL PRIMARY KEY,
                patient_id INT NULL,
                patient_name VARCHAR(255) NOT NULL,
                mrn VARCHAR(50) NULL,
                service_context VARCHAR(100),
                rating INT CHECK (rating >= 1 AND rating <= 5),
                tags TEXT,
                comment TEXT,
                sentiment VARCHAR(50) DEFAULT 'Neutral',
                nurse_id INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
                FOREIGN KEY (nurse_id) REFERENCES users(user_id)
            )
        `);
        console.log('patient_feedback table created successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

up();
