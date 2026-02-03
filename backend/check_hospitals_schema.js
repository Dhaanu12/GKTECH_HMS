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
        console.log('--- Checking Schema of "hospitals" table ---');
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hospitals'
        `);
        console.table(res.rows);

        // Try 'hospital_name' guess
        console.log('\n--- Trying to find Nano again ---');
        const hosp = await pool.query("SELECT * FROM hospitals WHERE hospital_name ILIKE '%Nano%'");
        console.table(hosp.rows);

    } catch (e) {
        console.error(e.message); // Just print error message
    } finally {
        await pool.end();
    }
}
run();
