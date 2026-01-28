const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Adding referral_patient_id column...');
        await client.query(`
            ALTER TABLE referral_patients 
            ADD COLUMN IF NOT EXISTS referral_patient_id VARCHAR(50) UNIQUE;
        `);
        console.log('✅ Column referral_patient_id added successfully.');
    } catch (err) {
        console.error('❌ Error adding column:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
