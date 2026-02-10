const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function fixSequences() {
    const tables = [
        'insurance_claims',
        'referral_doctor_module',
        'referral_doctor_service_percentage_module',
        'patients', // assuming id
        'appointment_requests' // assuming id
    ];

    try {
        for (const table of tables) {
            console.log(`Checking table: ${table}...`);
            try {
                // 1. Get Primary Key Column
                const pkRes = await pool.query(`
                    SELECT kcu.column_name 
                    FROM information_schema.table_constraints tc 
                    JOIN information_schema.key_column_usage kcu 
                        ON tc.constraint_name = kcu.constraint_name 
                        AND tc.table_schema = kcu.table_schema 
                    WHERE tc.constraint_type = 'PRIMARY KEY' 
                    AND tc.table_name = $1
                `, [table]);

                if (pkRes.rows.length === 0) {
                    console.log(`No primary key found for table ${table}, skipping.`);
                    continue;
                }

                const pkColumn = pkRes.rows[0].column_name;
                console.log(`Found PK for ${table}: ${pkColumn}`);

                // 2. Fix Sequence
                // Use pg_get_serial_sequence($1, $2) with table and column names
                // If this returns null, maybe manually construct sequence name? usually table_col_seq

                // Actually, pg_get_serial_sequence takes column name
                const seqRes = await pool.query(`SELECT pg_get_serial_sequence($1, $2) as seq`, [table, pkColumn]);
                const seqName = seqRes.rows[0].seq;

                if (!seqName) {
                    console.log(`No sequence found for ${table}.${pkColumn}, might be manually managed or not serial.`);
                    continue;
                }

                console.log(`Found sequence: ${seqName}. Fixing...`);

                const fixRes = await pool.query(`
                    SELECT setval($1, COALESCE(MAX(${pkColumn}), 0) + 1, false) 
                    FROM ${table};
                `, [seqName]); // Pass seqName as $1 to setval

                console.log(`Sequence fixed successfully! New value: ${fixRes.rows[0].setval}`);

            } catch (err) {
                console.error(`Error processing table ${table}:`, err.message);
            }
        }
    } catch (err) {
        console.error('Global error:', err);
    } finally {
        await pool.end();
    }
}

fixSequences();
