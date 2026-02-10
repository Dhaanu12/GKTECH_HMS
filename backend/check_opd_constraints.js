const db = require('./config/db');

async function checkOpdConstraints() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'opd_entries'::regclass
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

checkOpdConstraints();
