const { query } = require('./config/db');

async function inspect() {
    try {
        console.log('--- Inspecting prescriptions table columns ---');
        const res = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'prescriptions'
        `);
        res.rows.forEach(r => console.log(`${r.column_name}: ${r.data_type}`));
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

inspect();
