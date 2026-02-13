const { Client } = require('pg');
async function debug() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        console.log('--- DB COMPREHENSIVE DEBUG ---');

        console.log('\n1. Searching "gbrs" in billing_setup_master:');
        const res1 = await client.query("SELECT billing_setup_id, service_name, type_of_service, is_active, branch_id FROM billing_setup_master WHERE service_name ILIKE '%gbrs%';");
        console.table(res1.rows);

        console.log('\n2. Searching "gbrs" in medical_services:');
        const res2 = await client.query("SELECT service_id, service_name, category, is_active FROM medical_services WHERE service_name ILIKE '%gbrs%';");
        console.table(res2.rows);

        console.log('\n3. Distinct type_of_service in billing_setup_master:');
        const res3 = await client.query("SELECT DISTINCT type_of_service FROM billing_setup_master;");
        console.table(res3.rows);

        console.log('\n4. Distinct categories in medical_services:');
        const res4 = await client.query("SELECT DISTINCT category FROM medical_services;");
        console.table(res4.rows);

    } finally {
        await client.end();
    }
}
debug();
