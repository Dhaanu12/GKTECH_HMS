const { Client } = require('pg');
async function debug() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        console.log('--- ALL RECORDS IN billing_setup_master ---');
        const res = await client.query("SELECT * FROM billing_setup_master LIMIT 10;");
        console.table(res.rows);
    } finally {
        await client.end();
    }
}
debug();
