const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function main() {
    try {
        console.log('Adding ip_number to referral_payment_header...');
        await pool.query('ALTER TABLE referral_payment_header ADD COLUMN IF NOT EXISTS ip_number VARCHAR(50)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_referral_payment_ip ON referral_payment_header(ip_number)');
        await pool.query('CREATE INDEX IF NOT EXISTS idx_referral_payment_mci ON referral_payment_header(medical_council_id)');
        console.log('Success: ip_number column added.');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

main();
