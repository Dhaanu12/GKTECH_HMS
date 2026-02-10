const db = require('./config/db');

async function markAllExistingAsExternal() {
    try {
        const client = await db.getClient();

        console.log('Marking all existing lab orders as external (medical_service)...\n');
        console.log('Rationale: Existing orders were created before source tracking was implemented.');
        console.log('Future orders will be correctly categorized by the doctor.\n');

        // Update all existing lab orders to medical_service
        const updateResult = await client.query(`
            UPDATE lab_orders
            SET source = 'medical_service'
            WHERE source = 'billing_master'
        `);

        console.log(`✅ Updated ${updateResult.rowCount} lab orders to source = 'medical_service' (external)`);

        // Show final distribution
        const finalResult = await client.query(`
            SELECT source, COUNT(*) as count
            FROM lab_orders
            GROUP BY source
            ORDER BY source
        `);

        console.log('\n📊 Final source distribution:');
        finalResult.rows.forEach(row => {
            const label = row.source === 'medical_service' ? 'External (medical_service)' : 'In-House (billing_master)';
            console.log(`   ${label}: ${row.count}`);
        });

        console.log('\n✅ All existing lab orders are now marked as external.');
        console.log('   New lab orders will be correctly categorized based on doctor selection.');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

markAllExistingAsExternal();
