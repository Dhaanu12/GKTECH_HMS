const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migration = async () => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        console.log('Starting migration...');

        // 1. Add enabled_modules column to hospitals table
        console.log('Adding enabled_modules column to hospitals...');
        await client.query(`
            ALTER TABLE hospitals 
            ADD COLUMN IF NOT EXISTS enabled_modules JSONB DEFAULT NULL;
        `);

        // 2. Backfill existing hospitals with all modules
        console.log('Backfilling existing hospitals...');
        const allModules = JSON.stringify(["doc", "nurse", "lab", "pharma", "market", "acc", "reception"]);
        
        // Only update if currently null (which it should be for existing rows after add column)
        const result = await client.query(`
            UPDATE hospitals 
            SET enabled_modules = $1 
            WHERE enabled_modules IS NULL;
        `, [allModules]);

        console.log(`Updated ${result.rowCount} existing hospitals.`);

        // 3. Ensure Roles exist (Accountant and Marketing Executive weren't in seed_data.sql)
        console.log('Ensuring extra roles exist...');
        await client.query(`
            INSERT INTO roles (role_name, role_code, description, is_active) VALUES
            ('Accountant', 'ACCOUNTANT', 'Accounts and Billing', true),
            ('Marketing Executive', 'MARKETING_EXECUTIVE', 'Marketing and Sales', true)
            ON CONFLICT (role_code) DO NOTHING;
        `);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

migration();
