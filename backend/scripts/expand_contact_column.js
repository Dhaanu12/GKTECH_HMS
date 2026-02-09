const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function expandColumn() {
    try {
        await pool.query('ALTER TABLE branches ALTER COLUMN contact_number TYPE VARCHAR(100)');
        console.log('contact_number column expanded to 100 characters');
    } catch (e) {
        console.error('Expansion failed:', e);
    } finally {
        pool.end();
    }
}
expandColumn();
