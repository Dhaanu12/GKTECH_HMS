const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspectPatients() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'patients'
            ORDER BY column_name
        `);
        const columns = res.rows.map(r => r.column_name);
        console.log('--- TABLE: patients ---');
        console.log(columns.join(', '));

        const needed = ['city', 'state', 'pincode', 'contact_number', 'mrn_number'];
        console.log('\n--- CHECKING NEEDED COLUMNS ---');
        needed.forEach(col => {
            console.log(`${col}: ${columns.includes(col) ? 'EXISTS' : 'MISSING'}`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
inspectPatients();
