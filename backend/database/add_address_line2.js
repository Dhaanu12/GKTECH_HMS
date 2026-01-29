const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function runMigration() {
    try {
        console.log('Running migration: Adding address_line2 to patients table...');

        // check if column exists
        const checkRes = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='patients' AND column_name='address_line2';
        `);

        if (checkRes.rows.length === 0) {
            await pool.query(`ALTER TABLE patients ADD COLUMN address_line2 TEXT;`);
            console.log('Successfully added address_line2 column.');
        } else {
            console.log('Column address_line2 already exists.');
        }

        // Just to be sure, check if we need to rename address to address_line1 or just keep using address as logic for line 1.
        // I will stick to using 'address' column for 'Address Line 1' to avoid breaking existing queries that select 'address'.

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
