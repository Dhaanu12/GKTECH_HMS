
const { pool } = require('./config/db');

(async () => {
    try {
        console.log('Fixing "prescriptions" table schema...');

        // Add columns if they don't exist
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS opd_id INT;`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS patient_id INT;`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS doctor_id INT;`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS medicine_name VARCHAR(255);`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dosage VARCHAR(100);`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS frequency VARCHAR(100);`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS duration VARCHAR(100);`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS food_timing VARCHAR(100);`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS instructions TEXT;`);
        await pool.query(`ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';`);

        console.log('✅ Columns verified/added.');

        // Add constraints if needed (optional but good)
        // Note: Adding FKs might fail if data exists that violates them, so we skip for now or use careful ALTER

        // Now create the index
        await pool.query('CREATE INDEX IF NOT EXISTS idx_prescriptions_opd ON prescriptions(opd_id);');
        console.log('✅ Index created.');

    } catch (err) {
        console.error('❌ Error fixing table:', err);
    } finally {
        await pool.end();
    }
})();
