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

async function runMigration() {
    try {
        console.log('📝 Running GST rate migration...');

        const sqlPath = path.join(__dirname, '..', 'database', '007_add_gst_rate_to_services.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);

        console.log('✅ Migration completed successfully!');
        console.log('✅ Added gst_rate column to hospital_services table');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

runMigration();
