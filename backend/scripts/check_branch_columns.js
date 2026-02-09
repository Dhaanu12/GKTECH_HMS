const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspectBranches() {
    try {
        const res = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'branches'
            ORDER BY column_name
        `);
        const columns = res.rows.map(r => r.column_name);
        console.log('--- TABLE: branches ---');
        console.log(columns.join(', '));

        const needed = ['branch_name', 'address_line1', 'address_line2', 'city', 'state', 'pincode', 'contact_number'];
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
inspectBranches();
