const { Pool } = require('pg');
require('dotenv').config({ path: '../.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
});

async function checkSchema() {
    try {
        console.log('Checking opd_entries schema...');
        const res = await pool.query(`
            SELECT column_name, data_type, character_maximum_length 
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries' AND column_name LIKE '%attender%';
        `);
        console.table(res.rows);
    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await pool.end();
    }
}

checkSchema();
