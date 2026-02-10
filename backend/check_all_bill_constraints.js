const db = require('./config/db');

async function checkAllConstraints() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'bill_details'::regclass
            AND contype = 'c'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkAllConstraints();
