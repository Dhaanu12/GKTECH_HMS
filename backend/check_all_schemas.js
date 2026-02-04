const db = require('./config/db');

async function check() {
    try {
        const master = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_setup_master'");
        console.log('--- billing_setup_master ---');
        console.log(master.rows.map(r => r.column_name));

        const details = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_setup_package_details'");
        console.log('--- billing_setup_package_details ---');
        console.log(details.rows.map(r => r.column_name));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
