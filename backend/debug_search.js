const { Client } = require('pg');
async function check() {
    const client = new Client({ connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11' });
    await client.connect();
    try {
        console.log('--- IN-HOUSE (Billing Master) ---');
        const res1 = await client.query("SELECT * FROM billing_setup_master WHERE service_name ILIKE '%gbrs%';");
        res1.rows.forEach(r => console.log(`ID: ${r.billing_setup_id}, Name: ${r.service_name}, Type: ${r.type_of_service}, Branch: ${r.branch_id}, Active: ${r.is_active}`));

        console.log('\n--- EXTERNAL (Medical Services) ---');
        const res2 = await client.query("SELECT * FROM medical_services WHERE service_name ILIKE '%gbrs%';");
        res2.rows.forEach(r => console.log(`ID: ${r.service_id}, Name: ${r.service_name}, Category: ${r.category}, Active: ${r.is_active}`));

        console.log('\n--- ALL DISTINCT CATEGORIES (Medical Services) ---');
        const res3 = await client.query("SELECT DISTINCT category FROM medical_services ORDER BY category;");
        console.log(res3.rows.map(r => r.category).join(', '));
    } finally {
        await client.end();
    }
}
check();
