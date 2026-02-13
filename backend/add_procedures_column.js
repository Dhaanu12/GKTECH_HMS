
const { pool } = require('./config/db');

(async () => {
    try {
        console.log('Adding "procedures" column to "consultation_outcomes"...');
        const query = `ALTER TABLE consultation_outcomes ADD COLUMN IF NOT EXISTS procedures TEXT;`;
        const res = await pool.query(query);
        console.log('Success adding procedures:', res);

        // Ensure consultation_status exists too, just in case
        console.log('Ensuring "consultation_status" column exists...');
        const query2 = `ALTER TABLE consultation_outcomes ADD COLUMN IF NOT EXISTS consultation_status VARCHAR(50) DEFAULT 'Draft';`;
        const res2 = await pool.query(query2);
        console.log('Success adding/verifying consultation_status:', res2);

    } catch (err) {
        console.error('Error modifying table:', err);
    } finally {
        await pool.end();
    }
})();
