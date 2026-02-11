const { pool } = require('../config/db');

async function migrateSourceToIsExternal() {
    const client = await pool.connect();
    try {
        console.log('🔧 Migrating source column to is_external...\n');

        await client.query('BEGIN');

        // Step 1: Add new is_external column as boolean
        console.log('Step 1: Adding is_external column...');
        await client.query(`
            ALTER TABLE bill_details 
            ADD COLUMN IF NOT EXISTS is_external BOOLEAN DEFAULT FALSE
        `);

        // Step 2: Populate is_external based on source
        console.log('Step 2: Populating is_external values...');
        await client.query(`
            UPDATE bill_details 
            SET is_external = CASE 
                WHEN source = 'medical_service' THEN TRUE
                WHEN source = 'billing_master' THEN FALSE
                ELSE FALSE
            END
        `);

        // Step 3: Verify the migration
        const verifyResult = await client.query(`
            SELECT 
                source,
                is_external,
                COUNT(*) as count
            FROM bill_details
            GROUP BY source, is_external
            ORDER BY source, is_external
        `);

        console.log('\nVerification - Current data distribution:');
        console.table(verifyResult.rows);

        // Step 4: Drop the old source column
        console.log('\nStep 3: Dropping old source column...');
        await client.query(`
            ALTER TABLE bill_details 
            DROP COLUMN IF EXISTS source
        `);

        // Step 5: Make is_external NOT NULL
        console.log('Step 4: Setting is_external as NOT NULL...');
        await client.query(`
            ALTER TABLE bill_details 
            ALTER COLUMN is_external SET NOT NULL
        `);

        await client.query('COMMIT');

        // Final verification
        const finalResult = await client.query(`
            SELECT 
                is_external,
                COUNT(*) as count
            FROM bill_details
            GROUP BY is_external
            ORDER BY is_external
        `);

        console.log('\n✅ Migration complete! Final distribution:');
        console.table(finalResult.rows);

        console.log('\n📊 Summary:');
        console.log('  - is_external = TRUE  → Items from medical_services (External)');
        console.log('  - is_external = FALSE → Items from billing_master (In-House)');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error during migration:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

migrateSourceToIsExternal()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
