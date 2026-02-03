const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

const migration = async () => {
    console.log(`Connecting to DB: ${process.env.DB_NAME}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Fetch all hospitals
        const res = await client.query('SELECT hospital_id, enabled_modules FROM hospitals');

        for (const row of res.rows) {
            let modules = row.enabled_modules;

            // If it's already in new format (array of objects), skip
            if (Array.isArray(modules) && modules.length > 0 && typeof modules[0] === 'object') {
                console.log(`Skipping Hospital ${row.hospital_id} (already migrated)`);
                continue;
            }

            // Convert string array to object array
            let newModules = [];
            if (Array.isArray(modules)) {
                // It's an array of strings (or empty)
                newModules = modules.map(m => {
                    if (typeof m === 'string') {
                        return { id: m, is_active: true };
                    }
                    return null;
                }).filter(Boolean);
            } else if (modules === null) {
                // If null, keep as null or default? 
                // Plan said default new ones to null. Existing ones might be null if not backfilled?
                // Previous migration backfilled all. So likely ["doc", "nurse"...]
                // Let's safe guard.
                newModules = [];
            }

            console.log(`Migrating Hospital ${row.hospital_id}: ${JSON.stringify(modules)} -> ${JSON.stringify(newModules)}`);

            await client.query('UPDATE hospitals SET enabled_modules = $1 WHERE hospital_id = $2', [JSON.stringify(newModules), row.hospital_id]);
        }

        await client.query('COMMIT');
        console.log('Migration to Object Structure Completed.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

migration();
