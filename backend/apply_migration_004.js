const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function applyMigration() {
    try {
        await pool.connect();
        console.log('✅ Connected to database');

        const sql = fs.readFileSync(path.join(__dirname, 'database', '004_add_branch_modules_and_users.sql'), 'utf8');

        console.log('📦 Running migration 004 (Branch Modules & Roles)...');
        await pool.query(sql);

        console.log('✅ Migration 004 applied successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await pool.end();
    }
}

applyMigration();
