const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function fixLabOrdersSchema() {
    const client = await pool.connect();
    try {
        console.log('Starting schema migration for lab_orders...');
        await client.query('BEGIN');

        // 1. Add 'source' column if not exists
        const checkSource = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders' AND column_name = 'source'
        `);

        if (checkSource.rows.length === 0) {
            console.log("Adding 'source' column...");
            await client.query(`ALTER TABLE lab_orders ADD COLUMN source VARCHAR(50) DEFAULT 'medical_service'`);
        } else {
            console.log("'source' column already exists.");
        }

        // 2. Add 'test_code' column if not exists
        const checkTestCode = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders' AND column_name = 'test_code'
        `);

        if (checkTestCode.rows.length === 0) {
            console.log("Adding 'test_code' column...");
            await client.query(`ALTER TABLE lab_orders ADD COLUMN test_code VARCHAR(50)`);
        } else {
            console.log("'test_code' column already exists.");
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error migrating schema:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixLabOrdersSchema();
