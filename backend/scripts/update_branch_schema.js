const { pool } = require('../config/db');

async function updateSchema() {
    try {
        console.log('Adding columns to branches table...');

        await pool.query(`
            ALTER TABLE branches 
            ADD COLUMN IF NOT EXISTS consultation_rooms INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS daycare_available BOOLEAN DEFAULT FALSE,
            ADD COLUMN IF NOT EXISTS daycare_beds INTEGER DEFAULT 0,
            ADD COLUMN IF NOT EXISTS clinic_schedule JSONB DEFAULT NULL;
        `);

        console.log('Columns added successfully.');
        process.exit(0);
    } catch (err) {
        console.error('Error updating schema:', err);
        process.exit(1);
    }
}

updateSchema();
