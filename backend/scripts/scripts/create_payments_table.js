const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createPaymentsTable() {
    try {
        console.log('📝 Creating referral_payments table...');

        const sqlPath = path.join(__dirname, '..', 'database', '008_create_referral_payments_table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        console.log('✅ referral_payments table created successfully!');
        console.log('✅ This table will store:');
        console.log('   - GST calculation records');
        console.log('   - Payment status tracking');
        console.log('   - Payment history');

    } catch (error) {
        console.error('❌ Failed to create table:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

createPaymentsTable();
