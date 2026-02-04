const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Applying migration 007_add_marketing_roles.sql...');
        const sql = fs.readFileSync(path.join(__dirname, 'database', '007_add_marketing_roles.sql'), 'utf8');
        await client.query(sql);
        console.log('Migration 007 applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        client.release();
        pool.end();
    }
}

runMigration();
