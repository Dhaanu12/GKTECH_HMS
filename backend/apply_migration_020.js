require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root'
    });

    try {
        await client.connect();

        // Set timezone
        await client.query("SET timezone = 'Asia/Kolkata'");
        console.log('✅ Connected to database');

        const sqlPath = path.join(__dirname, 'migrations', '020_create_payment_transactions.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('📦 Running migration 020_create_payment_transactions...');
        await client.query(sql);
        console.log('✅ Migration 020 applied successfully!');

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        await client.end();
    }
}

runMigration();
