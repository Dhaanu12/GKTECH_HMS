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

async function addRelativeNumber() {
    try {
        console.log('Adding relatives_number column to patients table...');

        await pool.query(`
            ALTER TABLE patients 
            ADD COLUMN IF NOT EXISTS relatives_number VARCHAR(20)
        `);

        console.log('Successfully added relatives_number column');
    } catch (error) {
        console.error('Error adding column:', error);
    } finally {
        await pool.end();
    }
}

addRelativeNumber();
