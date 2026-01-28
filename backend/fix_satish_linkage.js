const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function run() {
    try {
        const doctorId = 35; // Confirmed ID for Satish
        const targetHospitalId = 40; // Nano Hospital
        const targetBranchId = 47; // Nano Hospital Main Branch

        console.log(`Fixing Doctor ${doctorId}...`);
        console.log(`Moving from current branch to Branch ${targetBranchId} (Hospital ${targetHospitalId})`);

        // Check Branch 45 just for logs
        const oldBranch = await pool.query("SELECT * FROM branches WHERE branch_id = 45");
        if (oldBranch.rows.length > 0) {
            console.log(`Old Branch 45 belongs to Hospital: ${oldBranch.rows[0].hospital_id} (${oldBranch.rows[0].branch_name})`);
        }

        // Update doctor_branches
        const res = await pool.query(`
            UPDATE doctor_branches 
            SET branch_id = $1, doc_hospital_id = $2
            WHERE doctor_id = $3
            RETURNING *
        `, [targetBranchId, targetHospitalId, doctorId]);

        console.table(res.rows);
        console.log('Update Complete.');

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
