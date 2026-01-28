const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'hms_database'
};

async function createAdmin() {
    console.log('Creating Super Admin...');

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to hms_database.');

        const filename = 'create_super_admin.sql';
        const filePath = path.join(__dirname, 'database', filename);
        console.log(`Running ${filename}...`);
        
        const sql = fs.readFileSync(filePath, 'utf8');
        await client.query(sql);
        
        console.log('Super Admin created successfully!');
    } catch (err) {
        console.error('Error creating admin:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

createAdmin();
