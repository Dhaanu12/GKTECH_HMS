
const { getClient } = require('../backend/config/db');

async function inspectTable() {
    const client = await getClient();
    try {
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries';
        `);
        console.log("Columns in opd_entries table:");
        result.rows.forEach(row => {
            console.log(`${row.column_name}: ${row.data_type}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
    }
}

inspectTable();
