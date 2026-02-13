const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Beginning migration: add_discount_remarks_to_billing_master');
        await client.query('BEGIN');

        // Check if column exists
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='billing_master' AND column_name='discount_remarks'
        `);

        if (res.rows.length === 0) {
            await client.query(`
                ALTER TABLE billing_master 
                ADD COLUMN discount_remarks TEXT;
            `);
            console.log('Added discount_remarks column to billing_master.');
        } else {
            console.log('discount_remarks column already exists.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
