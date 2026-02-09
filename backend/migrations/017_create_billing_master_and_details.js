const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration 017_create_billing_master_and_details...');
        await client.query('BEGIN');

        // Create billing_master table
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_master (
                bill_master_id SERIAL PRIMARY KEY,
                bill_number VARCHAR(50) UNIQUE NOT NULL,
                invoice_id VARCHAR(50),
                description TEXT,
                branch_id INT REFERENCES branches(branch_id),
                mrn_number VARCHAR(50), 
                bill_total DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pending',
                discounts DECIMAL(10, 2) DEFAULT 0,
                discount_id INT,
                inv_amount DECIMAL(10, 2) DEFAULT 0,
                payment_mode VARCHAR(50),
                transaction_number VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created billing_master table');

        // Create bill_details table
        await client.query(`
            CREATE TABLE IF NOT EXISTS bill_details (
                bill_detail_id SERIAL PRIMARY KEY,
                bill_number VARCHAR(50) REFERENCES billing_master(bill_number) ON DELETE CASCADE,
                invoice_id VARCHAR(50),
                contact_number VARCHAR(20),
                opd_number VARCHAR(50), 
                branch_id INT REFERENCES branches(branch_id),
                type_of_service VARCHAR(100),
                uuid UUID DEFAULT gen_random_uuid(),
                service_id INT REFERENCES medical_services(service_id),
                status VARCHAR(50) DEFAULT 'Pending',
                requested_by VARCHAR(100),
                cost DECIMAL(10, 2) DEFAULT 0,
                description TEXT, 
                final_price DECIMAL(10, 2) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created bill_details table');

        await client.query('COMMIT');
        console.log('Migration 017 completed successfully.');
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
