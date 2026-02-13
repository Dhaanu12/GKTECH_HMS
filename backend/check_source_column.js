const { Client } = require('pg');
async function checkSource() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        const res = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'lab_orders' AND column_name = 'source';");
        console.log('Exists:', res.rows.length > 0);
    } finally {
        await client.end();
    }
}
checkSource();
