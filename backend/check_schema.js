const { query } = require('./config/db');

async function checkSchema() {
    try {
        const res = await query(`
            ALTER TABLE appointments ADD COLUMN opd_id INTEGER REFERENCES opd_entries(opd_id);
        `);
        console.log("Added opd_id");
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
checkSchema();
