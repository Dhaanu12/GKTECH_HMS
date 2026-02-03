const { pool } = require('./config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('Adding new columns to insurance_claims...');

        await client.query(`
            ALTER TABLE insurance_claims 
            ADD COLUMN IF NOT EXISTS moc_discount NUMERIC DEFAULT 0,
            ADD COLUMN IF NOT EXISTS number_field_1 NUMERIC DEFAULT 0,
            ADD COLUMN IF NOT EXISTS system_notes TEXT
        `);

        console.log('Columns added successfully.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();
