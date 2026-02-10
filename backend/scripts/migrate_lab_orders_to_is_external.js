const { pool } = require('../config/db');

async function migrateLabOrdersSourceToIsExternal() {
    const client = await pool.connect();
    try {
        console.log('🔧 Migrating lab_orders table: source → is_external...\n');

        await client.query('BEGIN');

        // Step 1: Check if source column exists
        const checkSource = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'lab_orders' AND column_name = 'source'
        `);

        const hasSourceColumn = checkSource.rows.length > 0;

        // Step 2: Add is_external column
        console.log('Step 1: Adding is_external column...');
        await client.query(`
            ALTER TABLE lab_orders 
            ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT TRUE
        `);

        // Step 3: If source column exists, migrate data
        if (hasSourceColumn) {
            console.log('Step 2: Migrating data from source to is_external...');
            await client.query(`
                UPDATE lab_orders 
                SET is_external = CASE 
                    WHEN source = 'medical_service' THEN TRUE
                    WHEN source = 'billing_master' THEN FALSE
                    ELSE TRUE
                END
            `);

            // Verification
            const verifyResult = await client.query(`
                SELECT 
                    source,
                    is_external,
                    COUNT(*) as count
                FROM lab_orders
                GROUP BY source, is_external
                ORDER BY source, is_external
            `);

            console.log('\nData migration verification:');
            console.table(verifyResult.rows);

            // Step 4: Drop source column
            console.log('\nStep 3: Dropping old source column...');
            await client.query(`
                ALTER TABLE lab_orders 
                DROP COLUMN source
            `);
        } else {
            console.log('Step 2: No source column found, skipping migration...');
        }

        // Step 5: Make is_external NOT NULL
        console.log('Step 4: Setting is_external as NOT NULL with default TRUE...');
        await client.query(`
            ALTER TABLE lab_orders 
            ALTER COLUMN is_external SET NOT NULL,
            ALTER COLUMN is_external SET DEFAULT TRUE
        `);

        await client.query('COMMIT');

        // Final verification
        const finalResult = await client.query(`
            SELECT 
                is_external,
                COUNT(*) as count
            FROM lab_orders
            GROUP BY is_external
            ORDER BY is_external
        `);

        console.log('\n✅ Migration complete! Final distribution:');
        console.table(finalResult.rows);

        console.log('\n📊 Summary:');
        console.log('  - is_external = TRUE  → Items from medical_services (External labs/procedures)');
        console.log('  - is_external = FALSE → Items from billing_master (In-House services)');
        console.log('\n✅ lab_orders table updated successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateLabOrdersSourceToIsExternal()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
