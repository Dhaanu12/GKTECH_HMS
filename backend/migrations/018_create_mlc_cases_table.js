const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration 018_create_mlc_cases_table...');
        await client.query('BEGIN');

        // Create mlc_cases table
        await client.query(`
            CREATE TABLE IF NOT EXISTS mlc_cases (
                mlc_case_id SERIAL PRIMARY KEY,
                case_name VARCHAR(255) NOT NULL UNIQUE,
                category VARCHAR(100) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Created mlc_cases table');

        await client.query('COMMIT');
        console.log('Migration 018 completed successfully.');
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
