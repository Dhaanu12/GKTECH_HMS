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

const migrateBranches = async () => {
    console.log(`Connecting to DB: ${process.env.DB_NAME}`);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Check if column exists
        const checkRes = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'branches' AND column_name = 'enabled_modules';
        `);

        if (checkRes.rows.length === 0) {
            console.log('Adding enabled_modules column to branches table...');
            await client.query(`
                ALTER TABLE branches 
                ADD COLUMN enabled_modules JSONB DEFAULT NULL;
            `);
            console.log('Column added.');
        } else {
            console.log('Column enabled_modules already exists in branches.');
        }

        // Optional: Backfill? 
        // Logic: If NULL, it inherits from Hospital (or means All enabled). 
        // Existing branches having NULL is fine if logic handles it.
        // But for consistency with Hospital change, maybe we want it to be explicit?
        // User said: "if the hospital have acces only to marketing module, all the barnched udershud also have only marketing module acess."
        // This implies intersection logic. Hospital Config AND Branch Config.
        // If Branch Config is NULL, it should probably imply "All permissions granted by Hospital are allowed".
        // So keeping it NULL is a good default for "Inherit/No Restriction".

        await client.query('COMMIT');
        console.log('Branches Schema Migration Completed.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
};

migrateBranches();
