const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
};

const targetDb = 'hms_db_13';
const sqlFilePath = "C:\\Users\\Dhaanu\\Downloads\\hms_integrated_13Jan\\hms_integrated_13\\backend\\hms_db_13_01_2026.sql";

async function importDatabase() {
    console.log('Starting database import...');

    // Step 1: Create Database
    const client1 = new Client({
        ...dbConfig,
        database: 'postgres'
    });

    try {
        await client1.connect();
        console.log('Connected to postgres database.');

        try {
            await client1.query(`CREATE DATABASE "${targetDb}"`);
            console.log(`Database ${targetDb} created.`);
        } catch (err) {
            if (err.code === '42P04') {
                console.log(`Database ${targetDb} already exists.`);
            } else {
                throw err;
            }
        }
    } catch (err) {
        console.error('Error connecting to postgres or creating database:', err);
        process.exit(1);
    } finally {
        await client1.end();
    }

    // Step 2: Import SQL
    const client2 = new Client({
        ...dbConfig,
        database: targetDb
    });

    try {
        await client2.connect();
        console.log(`Connected to ${targetDb}.`);

        console.log(`Reading SQL file from ${sqlFilePath}...`);
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`File not found: ${sqlFilePath}`);
        }
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('Executing SQL...');
        await client2.query(sql);
        console.log('SQL file imported successfully!');

    } catch (err) {
        console.error('Error importing SQL file:', err);
        process.exit(1);
    } finally {
        await client2.end();
    }
}

importDatabase();
