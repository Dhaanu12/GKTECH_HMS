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

async function fixOpdSchema() {
    const client = await pool.connect();
    try {
        console.log('Starting schema migration for opd_entries...');
        await client.query('BEGIN');

        // 1. Find Constraint on checked_in_by
        const constraintRes = await client.query(`
            SELECT conname 
            FROM pg_constraint 
            WHERE conrelid = 'opd_entries'::regclass 
            AND contype = 'f' 
            AND conkey = ARRAY[(SELECT attnum FROM pg_attribute WHERE attrelid = 'opd_entries'::regclass AND attname = 'checked_in_by')]
        `);

        if (constraintRes.rows.length > 0) {
            const constraintName = constraintRes.rows[0].conname;
            console.log(`Found foreign key constraint: ${constraintName}. Dropping it...`);
            await client.query(`ALTER TABLE opd_entries DROP CONSTRAINT "${constraintName}"`);
        } else {
            console.log('No foreign key constraint found on checked_in_by.');
        }

        // 2. Check current type
        const res = await client.query(`
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries'
            AND column_name = 'checked_in_by';
        `);

        const currentType = res.rows[0]?.data_type;
        console.log(`Current type of checked_in_by: ${currentType}`);

        if (currentType !== 'character varying' && currentType !== 'text') {
            console.log('Altering checked_in_by to VARCHAR(100)...');
            // Assuming current values are integers or nulls that can be cast to text
            await client.query(`
                ALTER TABLE opd_entries 
                ALTER COLUMN checked_in_by TYPE VARCHAR(100) USING checked_in_by::VARCHAR;
            `);
            console.log('Column altered successfully.');
        } else {
            console.log('Column is already a string type, no action needed.');
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

fixOpdSchema();
