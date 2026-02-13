const { Client } = require('pg');

async function debugData() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        console.log('--- ALL RECORDS IN billing_setup_master ---');
        const res = await client.query("SELECT billing_setup_id, service_name, type_of_service FROM billing_setup_master");

        console.log(`Total records: ${res.rows.length}`);

        const gbrs = res.rows.filter(r => r.service_name.toLowerCase().includes('gbrs'));
        console.log(`\nFiltered results for 'gbrs' in memory: ${gbrs.length}`);
        console.table(gbrs);

        if (res.rows.length > 0) {
            console.log('\nFirst 5 records:');
            console.table(res.rows.slice(0, 5));
        }

    } finally {
        await client.end();
    }
}

debugData();
