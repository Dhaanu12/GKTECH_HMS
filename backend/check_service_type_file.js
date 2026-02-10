const db = require('./config/db');
const fs = require('fs');

async function checkServiceTypeConstraint() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'bill_details_service_type_check'
        `);
        fs.writeFileSync('service_type_constraint.txt', JSON.stringify(res.rows, null, 2));
        console.log('Written to service_type_constraint.txt');
        client.release();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkServiceTypeConstraint();
