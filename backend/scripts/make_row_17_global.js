const db = require('../config/db');

async function makeRow17Global() {
    try {
        console.log("Updating Billing Setup Master ID 17 to Branch 1 (Global)...");
        const res = await db.query(`UPDATE billing_setup_master SET branch_id = 1 WHERE billing_setup_id = 17`);
        console.log(`Updated ${res.rowCount} row(s).`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

makeRow17Global();
