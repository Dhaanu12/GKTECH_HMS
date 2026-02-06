const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function inspectOpd() {
    try {
        const res = await pool.query(`SELECT * FROM opd_entries LIMIT 1`);
        console.log('OPD Entries columns:', Object.keys(res.rows[0] || {}));

        // Also get column types to be sure
        const typeRes = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries'
        `);
        console.log('Column Types:', typeRes.rows.map(r => `${r.column_name} (${r.data_type})`));
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
inspectOpd();
