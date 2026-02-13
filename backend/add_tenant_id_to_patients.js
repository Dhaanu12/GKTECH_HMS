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
        console.log('Adding tenant_id to referral_patients...');
        await pool.query(`
            ALTER TABLE referral_patients 
            ADD COLUMN IF NOT EXISTS tenant_id INTEGER;
        `);
        console.log('Column added successfully.');

        console.log('Creating index...');
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_referral_patients_tenant ON referral_patients(tenant_id);
        `);
        console.log('Index created successfully.');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
