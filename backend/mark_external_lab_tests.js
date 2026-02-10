const db = require('./config/db');

async function markExternalLabTests() {
    try {
        const client = await db.getClient();

        console.log('Identifying external lab tests...\n');

        // Strategy: Check if lab order has associated billing records
        // If NO billing record exists, it's likely an external test
        const result = await client.query(`
            SELECT 
                lo.order_id,
                lo.test_name,
                lo.source,
                lo.ordered_at,
                CASE 
                    WHEN bd.bill_detail_id IS NULL THEN 'external'
                    ELSE 'in-house'
                END as actual_type
            FROM lab_orders lo
            LEFT JOIN prescriptions p ON lo.prescription_id = p.prescription_id
            LEFT JOIN consultation_outcomes co ON p.prescription_id = co.prescription_id
            LEFT JOIN billing_master bm ON co.opd_id = bm.opd_id
            LEFT JOIN bill_details bd ON bm.bill_master_id = bd.bill_master_id 
                AND bd.service_name = lo.test_name
            WHERE lo.source = 'billing_master'
            ORDER BY lo.ordered_at DESC
            LIMIT 20
        `);

        console.log('Sample of lab orders:');
        console.log('ID | Test Name | Current Source | Actual Type');
        console.log('---|-----------|----------------|------------');
        result.rows.forEach(row => {
            console.log(`${row.order_id} | ${row.test_name.substring(0, 30)}... | ${row.source} | ${row.actual_type}`);
        });

        // Count how many would be updated
        const externalCount = result.rows.filter(r => r.actual_type === 'external').length;
        console.log(`\n📊 Found ${externalCount} external tests out of ${result.rows.length} sampled`);

        // Update external tests
        if (externalCount > 0) {
            const updateResult = await client.query(`
                UPDATE lab_orders lo
                SET source = 'medical_service'
                FROM prescriptions p
                LEFT JOIN consultation_outcomes co ON p.prescription_id = co.prescription_id
                LEFT JOIN billing_master bm ON co.opd_id = bm.opd_id
                LEFT JOIN bill_details bd ON bm.bill_master_id = bd.bill_master_id 
                    AND bd.service_name = lo.test_name
                WHERE lo.prescription_id = p.prescription_id
                AND bd.bill_detail_id IS NULL
                AND lo.source = 'billing_master'
            `);

            console.log(`\n✅ Updated ${updateResult.rowCount} lab orders to source = 'medical_service' (external)`);
        }

        // Show final distribution
        const finalResult = await client.query(`
            SELECT source, COUNT(*) as count
            FROM lab_orders
            GROUP BY source
        `);

        console.log('\n📊 Final source distribution:');
        finalResult.rows.forEach(row => {
            console.log(`   ${row.source}: ${row.count}`);
        });

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

markExternalLabTests();
