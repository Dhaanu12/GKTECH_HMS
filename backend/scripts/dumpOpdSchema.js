const { getClient } = require('../config/db');

async function dumpSchema() {
    const client = await getClient();
    try {
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'opd_entries'
        `);
        console.log(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

dumpSchema();
