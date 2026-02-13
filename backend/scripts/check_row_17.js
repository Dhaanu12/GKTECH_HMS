const db = require('../config/db');

async function checkRow17() {
    try {
        console.log("Checking Billing Setup Master ID 17...");
        const res = await db.query(`SELECT * FROM billing_setup_master WHERE billing_setup_id = 17`);
        console.log(res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkRow17();
