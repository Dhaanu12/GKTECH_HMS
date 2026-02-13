const { Client } = require('pg');

async function checkSpaces() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        const res = await client.query("SELECT billing_setup_id, service_name, type_of_service, length(service_name) as slen, length(type_of_service) as tlen FROM billing_setup_master WHERE service_name ILIKE '%gbrs%'");
        console.log('Results with lengths:');
        res.rows.forEach(r => {
            console.log(`ID: ${r.billing_setup_id} | Name: "${r.service_name}" (len: ${r.slen}) | Type: "${r.type_of_service}" (len: ${r.tlen})`);
        });

        // Test exact matches
        const exactType = await client.query("SELECT COUNT(*) FROM billing_setup_master WHERE type_of_service = 'lab_test'");
        console.log(`\nCount with exactly 'lab_test': ${exactType.rows[0].count}`);

        const fuzzyType = await client.query("SELECT COUNT(*) FROM billing_setup_master WHERE type_of_service ILIKE '%lab_test%'");
        console.log(`Count with ILIKE '%lab_test%': ${fuzzyType.rows[0].count}`);

    } finally {
        await client.end();
    }
}

checkSpaces();
