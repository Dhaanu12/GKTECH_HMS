const db = require('./config/db');
const fs = require('fs');

async function checkOpdConstraints() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT conname, pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conrelid = 'opd_entries'::regclass
            AND contype = 'c'
        `);
        fs.writeFileSync('opd_constraints.txt', JSON.stringify(res.rows, null, 2));
        console.log('Written to opd_constraints.txt');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkOpdConstraints();
