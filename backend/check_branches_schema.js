const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function run() {
    try {
        console.log('--- Schema for "branches" ---');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'branches'
            ORDER BY ordinal_position
        `);
        res.rows.forEach(r => console.log(`${r.column_name} (${r.data_type})`));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
