const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function runSeed() {
    try {
        const sqlPath = path.join(__dirname, 'db', 'migrations', '002_seed_modules.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Seeding modules...');
        await pool.query(sql);
        console.log('Seed successful!');
    } catch (error) {
        console.error('Seed failed:', error);
    } finally {
        await pool.end();
    }
}

runSeed();
