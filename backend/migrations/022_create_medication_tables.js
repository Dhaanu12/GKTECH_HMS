const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration 022_create_medication_tables...');
        await client.query('BEGIN');

        // 1. Create medication_manufacturers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS medication_manufacturers (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL UNIQUE,
                status VARCHAR(50) DEFAULT 'active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created medication_manufacturers table');

        // 2. Create medication_master table
        await client.query(`
            CREATE TABLE IF NOT EXISTS medication_master (
                id SERIAL PRIMARY KEY,
                medicine_name VARCHAR(255) NOT NULL,
                generic_name VARCHAR(255),
                manufacturer_id INTEGER REFERENCES medication_manufacturers(id),
                category VARCHAR(100),
                strength VARCHAR(100),
                dosage_form VARCHAR(100),
                drug_class VARCHAR(100),
                schedule_type VARCHAR(100),
                prescription_required BOOLEAN DEFAULT false,
                status VARCHAR(50) DEFAULT 'active',
                default_adult_dose VARCHAR(255),
                default_pediatric_dose VARCHAR(255),
                route_of_administration VARCHAR(100),
                frequency VARCHAR(100),
                duration VARCHAR(100),
                instructions TEXT,
                max_dose_limit VARCHAR(100),
                is_global BOOLEAN DEFAULT true,
                hospital_id INTEGER REFERENCES hospitals(hospital_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created medication_master table');

        // 3. Create branch_medications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS branch_medications (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER REFERENCES branches(branch_id),
                medication_id INTEGER REFERENCES medication_master(id),
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(branch_id, medication_id)
            );
        `);
        console.log('Created branch_medications table');

        await client.query('COMMIT');
        console.log('Migration 022 completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
