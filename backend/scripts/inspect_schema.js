const { query } = require('../config/db');

async function inspect() {
    try {
        const tables = ['patients', 'opd_entries', 'billing_master', 'bill_details'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const res = await query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = '${table}';
            `);
            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type} (${r.is_nullable})`));
        }
    } catch (e) {
        console.error(e);
    }
    process.exit();
}

inspect();
