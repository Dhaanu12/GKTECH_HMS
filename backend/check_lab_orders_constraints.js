const db = require('./config/db');

async function checkConstraints() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'lab_orders'::regclass
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkConstraints();
