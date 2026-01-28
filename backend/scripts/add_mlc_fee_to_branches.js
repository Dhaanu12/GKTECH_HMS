const { pool } = require('../config/db');

async function addMlcFeeColumn() {
    const client = await pool.connect();
    try {
        console.log('Starting migration: Adding mlc_fee column to branches table...');

        await client.query('BEGIN');

        // Check if column exists
        const checkQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'branches' AND column_name = 'mlc_fee';
        `;
        const res = await client.query(checkQuery);

        if (res.rows.length === 0) {
            // Add column if it doesn't exist
            await client.query(`
                ALTER TABLE branches 
                ADD COLUMN mlc_fee DECIMAL(10, 2) DEFAULT 0;
            `);
            console.log('✅ Added mlc_fee column to branches table.');
        } else {
            console.log('ℹ️ mlc_fee column already exists in branches table.');
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

addMlcFeeColumn();
