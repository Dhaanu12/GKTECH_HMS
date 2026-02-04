const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function addPaymentMethod() {
    try {
        console.log('Adding payment_method column to opd_entries table...');

        await pool.query(`
            ALTER TABLE opd_entries 
            ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50)
        `);

        console.log('Successfully added payment_method column');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
    }
}

addPaymentMethod();
