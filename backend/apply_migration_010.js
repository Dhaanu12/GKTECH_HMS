const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function applyMigration() {
    try {
        console.log('Applying migration 010...');
        const sqlPath = path.join(__dirname, 'database', '010_add_branch_id_to_referral_doctor.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('Migration 010 applied successfully.');
    } catch (error) {
        console.error('Error applying migration:', error);
    } finally {
        await pool.end();
    }
}

applyMigration();
