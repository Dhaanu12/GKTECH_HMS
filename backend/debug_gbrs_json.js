const { Client } = require('pg');

async function debugData() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        const res = await client.query("SELECT * FROM billing_setup_master WHERE service_name ILIKE '%gbrs%'");
        console.log('Results for gbrs:');
        console.log(JSON.stringify(res.rows, null, 2));

        const resAll = await client.query("SELECT DISTINCT type_of_service FROM billing_setup_master");
        console.log('All categories:');
        console.log(JSON.stringify(resAll.rows, null, 2));

    } finally {
        await client.end();
    }
}

debugData();
