const { pool } = require('../config/db');

async function addIsUpdatedColumn() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding is_updated column to insurance_claims table...');

        await client.query('BEGIN');

        // Check if column exists
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'insurance_claims' AND column_name = 'is_updated';
        `;
        const res = await client.query(checkQuery);

        if (res.rows.length === 0) {
            // Add column if it doesn't exist
            // Using INTEGER (0/1) as requested or BOOLEAN? User said "it will be zero... change to 1".
            // BOOLEAN is cleaner but INTEGER 0/1 works exactly as described.
            // Let's use INTEGER with DEFAULT 0 to be explicit about "0" and "1".
            await client.query(`
                ALTER TABLE insurance_claims 
                ADD COLUMN is_updated INTEGER DEFAULT 0;
            `);
            console.log('✅ Added is_updated column to insurance_claims table.');
        } else {
            console.log('ℹ️ is_updated column already exists in insurance_claims table.');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

addIsUpdatedColumn();
