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
        console.log('Adding bank details columns to referral_agents table...');

        const query = `
            ALTER TABLE referral_agents
            ADD COLUMN IF NOT EXISTS bank_name VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bank_branch VARCHAR(255),
            ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(100),
            ADD COLUMN IF NOT EXISTS bank_ifsc_code VARCHAR(50),
            ADD COLUMN IF NOT EXISTS pan_card_number VARCHAR(255),
            ADD COLUMN IF NOT EXISTS pan_upload_path VARCHAR(500);
        `;

        await pool.query(query);
        console.log('Migration successful: Columns added to referral_agents.');

    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await pool.end();
    }
}

runMigration();
