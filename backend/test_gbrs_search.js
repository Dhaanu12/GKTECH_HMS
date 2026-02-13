const { Client } = require('pg');

async function testSearch() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        const term = 'gbrs';
        const category = 'lab_test';

        console.log(`Testing search for term: "${term}", category: "${category}"`);

        // Test Query 1: Simple search in billing_setup_master
        const res1 = await client.query(
            "SELECT billing_setup_id, service_name, type_of_service, is_active, branch_id FROM billing_setup_master WHERE service_name ILIKE $1",
            [`%${term}%`]
        );
        console.log('\n1. Simple name search result:');
        console.table(res1.rows);

        // Test Query 2: Search with category
        const res2 = await client.query(
            "SELECT billing_setup_id, service_name, type_of_service, is_active, branch_id FROM billing_setup_master WHERE service_name ILIKE $1 AND type_of_service = $2",
            [`%${term}%`, category]
        );
        console.log('\n2. Name + Category search result:');
        console.table(res2.rows);

        // Test Query 3: Check for hidden characters or case issues
        const res3 = await client.query(
            "SELECT billing_setup_id, length(service_name) as name_len, length(type_of_service) as cat_len, service_name, type_of_service FROM billing_setup_master WHERE service_name ILIKE $1",
            [`%${term}%`]
        );
        console.log('\n3. Hidden character check:');
        console.table(res3.rows);

    } finally {
        await client.end();
    }
}

testSearch();
