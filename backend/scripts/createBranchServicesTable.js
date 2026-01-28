const { pool } = require('../config/db');
require('dotenv').config({ path: '../.env' });

async function createTable() {
    const client = await pool.connect();
    try {
        console.log('Connected to database...');
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS branch_services (
                branch_service_id SERIAL PRIMARY KEY,
                branch_id INT NOT NULL,
                service_id INT NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (branch_id) REFERENCES branches(branch_id) ON DELETE CASCADE,
                FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
                UNIQUE (branch_id, service_id)
            );
        `);
        console.log('branch_services table created successfully.');

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating table:', error);
    } finally {
        client.release();
        pool.end();
    }
}

createTable();
