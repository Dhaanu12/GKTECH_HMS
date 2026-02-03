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
        console.log('Adding payment_type column...');
        await client.query(`
            ALTER TABLE referral_patients 
            ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) CHECK (payment_type IN ('Cash', 'Insurance')) DEFAULT 'Cash';
        `);
        console.log('✅ Column payment_type added successfully.');
    } catch (err) {
        console.error('❌ Error adding column:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration();
