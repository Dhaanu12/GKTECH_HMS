const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration 019_rename_mlc_cases_to_types...');
        await client.query('BEGIN');

        // Rename table
        await client.query(`ALTER TABLE IF EXISTS mlc_cases RENAME TO mlc_case_types;`);
        console.log('Renamed table to mlc_case_types');

        // Rename primary key column
        await client.query(`ALTER TABLE IF EXISTS mlc_case_types RENAME COLUMN mlc_case_id TO mlc_case_type_id;`);
        console.log('Renamed primary key to mlc_case_type_id');

        await client.query('COMMIT');
        console.log('Migration 019 completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

migrate();
