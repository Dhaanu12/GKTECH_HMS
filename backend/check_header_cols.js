const { Pool } = require('pg');
require('dotenv').config(); // Default looks in current directory

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function checkColumns() {
    try {
        console.log('--- referral_payment_header ---');
        const resHeader = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'referral_payment_header';
        `);
        console.log(resHeader.rows.map(r => r.column_name).join(', '));

        console.log('\n--- referral_doctor_module ---');
        const resDoctor = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'referral_doctor_module';
        `);
        console.log(resDoctor.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkColumns();
