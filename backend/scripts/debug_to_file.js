const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const outputPath = path.join(process.cwd(), 'debug_output.txt');

try {
    fs.writeFileSync(outputPath, "STARTING DEBUG...\n");
} catch (e) {
    console.error("Failed to write file:", e);
    process.exit(1);
}

const client = new Client({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'gktech_hms',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

(async () => {
    try {
        await client.connect();
        fs.appendFileSync(outputPath, "CONNECTED TO DB\n");
        
        const today = new Date().toISOString().split('T')[0];
        const res = await client.query(`SELECT opd_id, consultation_fee FROM opd_entries WHERE DATE(visit_date) = CURRENT_DATE`);
        fs.appendFileSync(outputPath, `OPD Entries: ${JSON.stringify(res.rows)}\n`);

        const res2 = await client.query(`SELECT bill_master_id, total_amount, paid_amount FROM billing_master WHERE DATE(billing_date) = CURRENT_DATE`);
        fs.appendFileSync(outputPath, `Bills: ${JSON.stringify(res2.rows)}\n`);

    } catch (err) {
        fs.appendFileSync(outputPath, `ERROR: ${err.message}\n`);
    } finally {
        await client.end();
        fs.appendFileSync(outputPath, "DONE\n");
    }
})();
