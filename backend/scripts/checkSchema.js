const fs = require('fs');
const { getClient } = require('../config/db');

async function checkSchema() {
    const client = await getClient();
    try {
        const tables = ['patients', 'opd_entries', 'billing_master', 'insurance_claims', 'bill_details', 'appointments'];
        let output = '';
        for (const table of tables) {
            const res = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = $1
            `, [table]);
            output += `\nTable: ${table}\n`;
            output += res.rows.map(r => r.column_name).join(', ') + '\n';
        }
        fs.writeFileSync('schema_output.txt', output);
        console.log('Schema written to schema_output.txt');
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }
}

checkSchema();
