const db = require('./config/db');

async function updateExistingLabOrdersSource() {
    try {
        const client = await db.getClient();

        // Check current state
        const checkResult = await client.query(`
            SELECT source, COUNT(*) as count
            FROM lab_orders
            GROUP BY source
        `);

        console.log('Current source distribution:');
        console.log(checkResult.rows);

        // Update all NULL or empty source values to 'billing_master' (default for existing records)
        const updateResult = await client.query(`
            UPDATE lab_orders
            SET source = 'billing_master'
            WHERE source IS NULL OR source = ''
        `);

        console.log(`\n✅ Updated ${updateResult.rowCount} lab orders to have source = 'billing_master'`);

        // Show final state
        const finalResult = await client.query(`
            SELECT source, COUNT(*) as count
            FROM lab_orders
            GROUP BY source
        `);

        console.log('\nFinal source distribution:');
        console.log(finalResult.rows);

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error updating lab orders:', err);
        process.exit(1);
    }
}

updateExistingLabOrdersSource();
