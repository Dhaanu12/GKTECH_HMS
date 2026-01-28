require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    });

    try {
        await client.connect();

        // Set session timezone to IST just in case
        await client.query("SET timezone = 'Asia/Kolkata'");
        console.log('✅ Connected to database (Timezone Set to Asia/Kolkata)');

        const sqlPath = path.join(__dirname, 'database', '001_add_modules_and_marketing.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📦 Running migration 001...');
        await client.query(sql);
        console.log('✅ Migration 001 applied successfully!');

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        await client.end();
    }
}

runMigration();
