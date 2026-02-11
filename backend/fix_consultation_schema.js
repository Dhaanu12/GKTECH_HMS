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

async function fixConsultationSchema() {
    const client = await pool.connect();
    try {
        console.log('Starting schema migration for consultation_outcomes...');
        await client.query('BEGIN');

        // 1. Add 'diagnostic_center' column if not exists
        const checkColumn = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'consultation_outcomes' AND column_name = 'diagnostic_center'
        `);

        if (checkColumn.rows.length === 0) {
            console.log("Adding 'diagnostic_center' column...");
            await client.query(`ALTER TABLE consultation_outcomes ADD COLUMN diagnostic_center VARCHAR(255)`);
        } else {
            console.log("'diagnostic_center' column already exists.");
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

fixConsultationSchema();
