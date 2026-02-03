const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_database',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function runSetup() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        
        console.log('Reading SQL file...');
        const sqlPath = path.join(__dirname, 'database', 'insurance_claims_setup.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('Executing SQL...');
        await client.query(sql);
        
        console.log('✅ Database setup completed successfully!');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error executing SQL:', err);
        process.exit(1);
    }
}

runSetup();
