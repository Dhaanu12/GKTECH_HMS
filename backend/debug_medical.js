const { Client } = require('pg');
async function check() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        const res = await client.query("SELECT * FROM medical_services WHERE service_name ILIKE '%gbrs%';");
        console.log('Full row for gbrs in medical_services:', JSON.stringify(res.rows[0], null, 2));
    } finally {
        await client.end();
    }
}
check();
