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

async function checkSchema() {
    try {
        console.log('Checking opd_entries schema...');
        const res = await pool.query(`
            SELECT column_name, data_type, column_default, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries'
            AND column_name = 'checked_in_by';
        `);
        console.table(res.rows);

        const constraints = await pool.query(`
            SELECT conname, contype, pg_get_constraintdef(oid) as def 
            FROM pg_constraint 
            WHERE conrelid = 'opd_entries'::regclass
            AND conname LIKE '%checked_in_by%'; -- or anything similar
        `);
        console.table(constraints.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
