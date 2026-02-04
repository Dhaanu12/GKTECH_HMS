const db = require('./config/db');

async function check() {
    try {
        const res = await db.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'medical_services'");
        console.log('Columns for medical_services:', res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

check();
