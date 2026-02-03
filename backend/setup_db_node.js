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

async function setupDatabase() {
    console.log('Starting database setup...');

    // Step 1: Create Database
    const client1 = new Client({
        ...dbConfig,
        database: 'postgres'
    });

    try {
        await client1.connect();
        console.log('Connected to postgres database.');
        
        try {
            await client1.query('CREATE DATABASE hms_database');
            console.log('Database hms_database created.');
        } catch (err) {
            if (err.code === '42P04') {
                console.log('Database hms_database already exists.');
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

    // Step 2: Run SQL Scripts
    const client2 = new Client({
        ...dbConfig,
        database: 'hms_database'
    });

    try {
        await client2.connect();
        console.log('Connected to hms_database.');

        const runSqlFile = async (filename) => {
            const filePath = path.join(__dirname, 'database', filename);
            console.log(`Running ${filename}...`);
            const sql = fs.readFileSync(filePath, 'utf8');
            await client2.query(sql);
            console.log(`Finished ${filename}.`);
        };

        await runSqlFile('schema.sql');
        await runSqlFile('auth_tables.sql');
        await runSqlFile('seed_data.sql');

        console.log('Database setup completed successfully!');
    } catch (err) {
        console.error('Error running SQL scripts:', err);
        process.exit(1);
    } finally {
        await client2.end();
    }
}

setupDatabase();
