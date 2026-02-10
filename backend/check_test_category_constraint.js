const db = require('./config/db');

async function checkSpecificConstraint() {
    try {
        const client = await db.getClient();
        const res = await client.query(`
            SELECT pg_get_constraintdef(oid) as definition
            FROM pg_constraint
            WHERE conname = 'lab_orders_test_category_check'
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkSpecificConstraint();
