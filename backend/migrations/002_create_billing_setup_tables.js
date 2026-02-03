const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration 002_create_billing_setup_tables...');
        await client.query('BEGIN');

        // Create billing_setup_master table
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_setup_master (
                billing_setup_id SERIAL PRIMARY KEY,
                uuid UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
                type_of_service VARCHAR(50) NOT NULL CHECK (type_of_service IN ('service', 'package')),
                service_name VARCHAR(255) NOT NULL,
                patient_charge DECIMAL(10, 2) DEFAULT 0,
                b2b_charge DECIMAL(10, 2) DEFAULT 0,
                special_charge DECIMAL(10, 2) DEFAULT 0,
                branch_id INT REFERENCES branches(branch_id),
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT REFERENCES users(user_id),
                updated_by INT REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created billing_setup_master table');

        // Create billing_setup_package_details table
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_setup_package_details (
                detail_id SERIAL PRIMARY KEY,
                package_uuid UUID REFERENCES billing_setup_master(uuid) ON DELETE CASCADE,
                service_name VARCHAR(255) NOT NULL,
                patient_charge DECIMAL(10, 2) DEFAULT 0,
                b2b_charge DECIMAL(10, 2) DEFAULT 0,
                special_charge DECIMAL(10, 2) DEFAULT 0,
                is_active BOOLEAN DEFAULT TRUE,
                created_by INT REFERENCES users(user_id),
                updated_by INT REFERENCES users(user_id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created billing_setup_package_details table');

        await client.query('COMMIT');
        console.log('Migration 002_create_billing_setup_tables completed successfully.');
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
