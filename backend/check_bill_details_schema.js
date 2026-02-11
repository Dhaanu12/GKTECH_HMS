const { pool } = require('./config/db');

async function checkSchema() {
    try {
        console.log('Checking bill_details schema...\n');
        const res = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'bill_details'
            ORDER BY ordinal_position;
        `);
        console.table(res.rows);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
}

checkSchema();
