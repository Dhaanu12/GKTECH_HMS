const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runMigration() {
    try {
        console.log('🔌 Connecting to database...');
        const client = await pool.connect();

        try {
            console.log('🔨 Creating referral_patients table...');
            const sqlPath = path.join(__dirname, '..', 'database', 'referral_patients.sql');
            const sql = await fs.readFile(sqlPath, 'utf8');
            await client.query(sql);
            console.log('✅ referral_patients table created successfully.');

            // Verify
            const res = await client.query("SELECT to_regclass('public.referral_patients')");
            console.log('🔍 Verification:', res.rows[0].to_regclass ? 'Table exists' : 'Table missing');

        } catch (err) {
            console.error('❌ Migration failed:', err.message);
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

runMigration();
