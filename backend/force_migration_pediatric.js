require('dotenv').config();
const { Client } = require('pg');

async function forceMigration() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const query = `
            DO $$
            BEGIN
                -- 1. Update patients table
                ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_gender_check;
                ALTER TABLE patients ADD CONSTRAINT patients_gender_check CHECK (gender IN ('Male', 'Female', 'Other', 'Pediatric'));
                RAISE NOTICE 'Updated patients table constraint';

                -- 2. Update appointments table
                ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_gender_check;
                ALTER TABLE appointments ADD CONSTRAINT appointments_gender_check CHECK (gender IN ('Male', 'Female', 'Other', 'Pediatric'));
                RAISE NOTICE 'Updated appointments table constraint';
            END $$;
        `;

        await client.query(query);
        console.log('✅ Migration applied successfully!');

    } catch (error) {
        console.error('❌ Error executing migration:', error);
    } finally {
        await client.end();
    }
}

forceMigration();
