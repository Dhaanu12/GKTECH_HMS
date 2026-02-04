const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    try {
        console.log('Adding kyc_upload_path column to referral_doctor_module...');

        await pool.query(`
            ALTER TABLE referral_doctor_module 
            ADD COLUMN IF NOT EXISTS kyc_upload_path TEXT;
        `);

        console.log('Migration successful: Column added.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
