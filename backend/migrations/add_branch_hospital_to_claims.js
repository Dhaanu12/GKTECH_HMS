const { pool } = require('../config/db');

const migrate = async () => {
    try {
        console.log('Starting migration...');
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Add branch_id column
            console.log('Adding branch_id column...');
            await client.query(`
                ALTER TABLE insurance_claims 
                ADD COLUMN IF NOT EXISTS branch_id INTEGER REFERENCES branches(branch_id);
            `);
            
            // Add hospital_id column
            console.log('Adding hospital_id column...');
            await client.query(`
                ALTER TABLE insurance_claims 
                ADD COLUMN IF NOT EXISTS hospital_id INTEGER REFERENCES hospitals(hospital_id);
            `);
            
            await client.query('COMMIT');
            console.log('Migration completed successfully');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();
