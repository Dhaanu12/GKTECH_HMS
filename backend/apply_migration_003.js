require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'phc_hms_08',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    });

    try {
        await client.connect();

        // Ensure IST
        await client.query("SET timezone = 'Asia/Kolkata'");
        console.log('✅ Connected to database');

        const sqlPath = path.join(__dirname, 'database', '003_add_uuid_fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📦 Running migration 003 (Adding UUIDs)...');
        await client.query(sql);
        console.log('✅ Migration 003 applied successfully!');

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        await client.end();
    }
}

runMigration();
