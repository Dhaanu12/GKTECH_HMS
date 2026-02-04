const fs = require('fs').promises;
const path = require('path');
const { pool } = require('../config/db');

async function runMigration() {
    try {
        console.log('Running migration 013...');
        const sqlPath = path.join(__dirname, '../database/013_create_lead_data_table.sql');
        const sql = await fs.readFile(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Migration 013 successful');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration failed:', err);
        process.exit(1);
    }
}

runMigration();
