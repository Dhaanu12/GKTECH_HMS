const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function alterColumn() {
    try {
        console.log('Altering attender_contact_number to TEXT...');
        await pool.query(`
            ALTER TABLE opd_entries 
            ALTER COLUMN attender_contact_number TYPE TEXT;
        `);
        console.log('SUCCESS: Column type changed to TEXT.');
    } catch (error) {
        console.error('Error altering column:', error);
    } finally {
        await pool.end();
    }
}

alterColumn();
