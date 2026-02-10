const { pool } = require('../config/db');

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if column exists
        const checkRes = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='opd_entries' AND column_name='department_id'
        `);

        if (checkRes.rows.length === 0) {
            console.log('Adding department_id column to opd_entries table...');
            await client.query(`
                ALTER TABLE opd_entries 
                ADD COLUMN department_id INTEGER REFERENCES departments(department_id)
            `);
            console.log('Column added successfully.');
        } else {
            console.log('Column department_id already exists in opd_entries.');
        }

        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
