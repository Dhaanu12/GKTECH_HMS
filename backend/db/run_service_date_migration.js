const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Running migration: Adding service_date to referral_payment_header');

        // Add service_date column
        await client.query(`
            ALTER TABLE referral_payment_header 
            ADD COLUMN IF NOT EXISTS service_date DATE;
        `);
        console.log('✓ Added service_date column');

        // Create index
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_header_service_date 
            ON referral_payment_header(service_date);
        `);
        console.log('✓ Created index on service_date');

        // Drop old unique constraint if exists
        await client.query(`
            DROP INDEX IF EXISTS idx_header_unique_ip_mci;
        `);
        console.log('✓ Dropped old unique constraint (if existed)');

        // Create new unique constraint
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS idx_header_unique_mapping 
            ON referral_payment_header(medical_council_id, ip_number, service_date) 
            WHERE medical_council_id IS NOT NULL 
            AND ip_number IS NOT NULL 
            AND service_date IS NOT NULL;
        `);
        console.log('✓ Created unique constraint on (medical_council_id, ip_number, service_date)');

        // Add comment
        await client.query(`
            COMMENT ON COLUMN referral_payment_header.service_date 
            IS 'Date when services were rendered to the patient';
        `);
        console.log('✓ Added column comment');

        // Verify the column was added
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'referral_payment_header' 
            AND column_name = 'service_date'
        `);

        if (result.rows.length > 0) {
            console.log('✓ Migration completed successfully!');
            console.log('  Column details:', result.rows[0]);
        } else {
            console.log('⚠ Warning: service_date column not found after migration');
        }

    } catch (error) {
        console.error('❌ Error running migration:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigration().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
