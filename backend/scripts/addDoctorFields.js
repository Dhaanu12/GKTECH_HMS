const { pool } = require('../config/db');

async function addDoctorFields() {
    const client = await pool.connect();
    try {
        console.log('Adding new fields to doctors table...');
        await client.query('BEGIN');

        // Add columns if they don't exist
        await client.query(`
            DO $$ 
            BEGIN 
                -- Bank Name
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='bank_name') THEN
                    ALTER TABLE doctors ADD COLUMN bank_name VARCHAR(255);
                END IF;

                -- Account Number
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='account_number') THEN
                    ALTER TABLE doctors ADD COLUMN account_number VARCHAR(50);
                END IF;

                -- IFSC Code
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='ifsc_code') THEN
                    ALTER TABLE doctors ADD COLUMN ifsc_code VARCHAR(20);
                END IF;

                -- Doctor Type (In-house vs Visiting)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='doctor_type') THEN
                    ALTER TABLE doctors ADD COLUMN doctor_type VARCHAR(50) DEFAULT 'In-house' CHECK (doctor_type IN ('In-house', 'Visiting'));
                END IF;

                -- Signature (URL or Path)
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='doctors' AND column_name='signature_url') THEN
                    ALTER TABLE doctors ADD COLUMN signature_url VARCHAR(255);
                END IF;
            END $$;
        `);

        console.log('Columns added successfully.');
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding columns:', error);
    } finally {
        client.release();
        pool.end();
    }
}

addDoctorFields();
