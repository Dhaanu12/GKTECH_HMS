const db = require('./config/db');

async function checkBillDetailsSchema() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'bill_details'
            ORDER BY ordinal_position
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBillDetailsSchema();
