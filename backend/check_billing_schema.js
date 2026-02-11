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

async function checkSchema() {
    try {
        console.log('Checking billing_master schema...');
        const res1 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'billing_master'
            AND column_name = 'created_by';
        `);
        console.table(res1.rows);

        console.log('Checking bill_details schema...');
        const res2 = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'bill_details'
            AND column_name = 'created_by';
        `);
        console.table(res2.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
