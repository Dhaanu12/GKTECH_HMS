const { query } = require('./config/db');

async function inspect() {
    try {
        const tables = ['lab_orders', 'billing_master', 'bill_details'];
        for (const table of tables) {
            console.log(`\n--- ${table} ---`);
            const res = await query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
