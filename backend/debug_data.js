const { Client } = require('pg');
async function check() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        console.log('--- DB DATA CHECK ---');
        const res = await client.query("SELECT * FROM billing_setup_master WHERE service_name ILIKE '%gbrs%';");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await client.end();
    }
}
check();
