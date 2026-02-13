const { Client } = require('pg');

async function reproduceSearch() {
    const client = new Client({
        connectionString: 'postgresql://postgres:root@localhost:5432/hms_febb_11'
    });
    await client.connect();

    try {
        const term = 'gbrs';
        const category = 'lab_test';
        const actualBranchId = 1;
        const limit = 50;

        console.log(`Reproducing search for: term="${term}", category="${category}", branchId="${actualBranchId}"`);

        // Exact logic from BillingSetupController.js
        let billingQuery = `
            SELECT bsm.billing_setup_id as id, bsm.service_name, bsm.type_of_service as category, bsm.patient_charge as price, bsm.branch_id
            FROM billing_setup_master bsm
            WHERE (bsm.is_active = true OR bsm.is_active IS NULL OR bsm.is_active = false)
            AND bsm.service_name ILIKE $1
        `;
        const billingParams = [`%${term}%`];

        if (category) {
            billingQuery += ` AND bsm.type_of_service = $2`;
            billingParams.push(category);
        }

        billingQuery += ` ORDER BY 
            CASE 
                WHEN bsm.branch_id = $${billingParams.length + 1} THEN 0 
                WHEN bsm.branch_id = 1 THEN 1 
                ELSE 2 
            END, bsm.service_name ASC LIMIT $${billingParams.length + 2}`;

        billingParams.push(actualBranchId);
        billingParams.push(limit);

        console.log('Query:', billingQuery);
        console.log('Params:', billingParams);

        const res = await client.query(billingQuery, billingParams);
        console.log(`\nMatches found: ${res.rows.length}`);
        console.log(JSON.stringify(res.rows, null, 2));

    } finally {
        await client.end();
    }
}

reproduceSearch();
