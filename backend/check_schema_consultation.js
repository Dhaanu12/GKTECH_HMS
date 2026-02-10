const db = require('./config/db');

async function checkSchema() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'consultation_outcomes'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        // process.exit(0);
    }
}

checkSchema();
