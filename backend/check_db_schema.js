const db = require('./config/db');

async function checkSchema() {
    const client = await db.getClient();
    try {
        // Check appointments columns
        const apptCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments';
        `);
        console.log('Appointments columns:', apptCols.rows);

        // Check billing_master
        const bmCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'billing_master';
        `);
        console.log('Billing Master columns:', bmCols.rows);

        // Check bill_details
        const bdCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'bill_details';
        `);
        console.log('Bill Details columns:', bdCols.rows);
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
        process.exit(0);
    }
}

checkSchema();
