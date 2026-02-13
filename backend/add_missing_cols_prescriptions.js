
const { pool } = require('./config/db');

(async () => {
    try {
        console.log('Adding "procedures" column to "prescriptions"...');
        const query = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS procedures TEXT;`;
        const res = await pool.query(query);
        console.log('Success adding procedures:', res);

        console.log('Adding "medications" column to "prescriptions"...');
        const query2 = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medications JSONB;`;
        const res2 = await pool.query(query2);
        console.log('Success adding medications:', res2);

        console.log('Adding "labs" column to "prescriptions"...');
        const query3 = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS labs JSONB;`;
        const res3 = await pool.query(query3);
        console.log('Success adding labs:', res3);

        console.log('Adding "notes" column to "prescriptions"...');
        const query4 = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS notes TEXT;`;
        const res4 = await pool.query(query4);
        console.log('Success adding notes:', res4);

        console.log('Adding "diagnosis" column to "prescriptions"...');
        const query5 = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS diagnosis TEXT;`;
        const res5 = await pool.query(query5);
        console.log('Success adding diagnosis:', res5);

        console.log('Adding "branch_id" column to "prescriptions"...');
        const query6 = `ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS branch_id INT;`;
        const res6 = await pool.query(query6);
        console.log('Success adding branch_id:', res6);


    } catch (err) {
        console.error('Error modifying table:', err);
    } finally {
        await pool.end();
    }
})();
