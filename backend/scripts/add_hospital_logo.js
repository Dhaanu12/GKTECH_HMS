const { pool } = require('../config/db');

async function addLogoToHospitals() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Check if logo_url column already exists
        const checkColumnQuery = `
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'hospitals' 
            AND column_name = 'logo_url'
        `;

        const result = await client.query(checkColumnQuery);

        if (result.rows.length === 0) {
            console.log('Adding logo_url column to hospitals table...');

            await client.query(`
                ALTER TABLE hospitals 
                ADD COLUMN logo_url VARCHAR(500)
            `);

            console.log('✓ logo_url column added successfully');
        } else {
            console.log('logo_url column already exists, skipping...');
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
addLogoToHospitals()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
