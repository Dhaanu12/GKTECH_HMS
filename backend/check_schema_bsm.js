const { Client } = require('pg');

async function checkSchema() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'billing_setup_master'");
        console.log(JSON.stringify(res.rows, null, 2));
    } finally {
        await client.end();
    }
}

checkSchema();
