const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function migrate() {
    try {
        console.log('Adding mlc_fee column to opd_entries table...');
        await pool.query(`
            ALTER TABLE opd_entries 
            ADD COLUMN IF NOT EXISTS mlc_fee DECIMAL(10, 2) DEFAULT 0.00
        `);
        console.log('✅ Column mlc_fee added successfully.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        pool.end();
    }
}
migrate();
