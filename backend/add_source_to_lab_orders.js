const db = require('./config/db');

async function addSourceColumnToLabOrders() {
    try {
        const client = await db.getClient();

        // Add source column to lab_orders table
        await client.query(`
            ALTER TABLE lab_orders 
            ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'billing_master';
        `);

        console.log('✅ Successfully added source column to lab_orders table');
        console.log('   - Default value: billing_master (in-house)');
        console.log('   - External tests will have: medical_service');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error adding column:', err);
        process.exit(1);
    }
}

addSourceColumnToLabOrders();
