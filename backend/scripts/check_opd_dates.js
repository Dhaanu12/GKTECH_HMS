const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkOpdDates() {
    try {
        console.log('Checking recent OPD entries...');
        const res = await pool.query(`
            SELECT opd_id, visit_date, created_at, visit_status, branch_id, patient_id 
            FROM opd_entries 
            ORDER BY created_at DESC 
            LIMIT 5
        `);

        console.log('Recent OPD Entries:');
        res.rows.forEach(row => {
            console.log(JSON.stringify(row, null, 2));
            // Explicitly show visit_date type and value
            console.log(`visit_date raw: ${row.visit_date} (Type: ${typeof row.visit_date})`);
            console.log(`visit_date constructor: ${row.visit_date.constructor.name}`);
        });

        // Also check server time
        const timeRes = await pool.query('SELECT NOW() as server_time, CURRENT_DATE as server_date');
        console.log('DB Server Time:', timeRes.rows[0]);

    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkOpdDates();
