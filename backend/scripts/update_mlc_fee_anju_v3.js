const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function findAndUpdate() {
    try {
        // 1. Find ANY appointment for Dr. Anju (ID 39) to get branch_id
        console.log('Searching appointments for Dr. Anju (ID 39)...');
        const apptRes = await pool.query(`
            SELECT branch_id FROM appointments 
            WHERE doctor_id = 39 
            AND branch_id IS NOT NULL 
            LIMIT 1
        `);

        let branchId;
        if (apptRes.rows.length > 0) {
            branchId = apptRes.rows[0].branch_id;
            console.log(`Found Branch ID from appointments: ${branchId}`);
        } else {
            console.log('No appointments with branch_id found for Dr. Anju.');
            // Fallback: Check opd_entries? Assuming similar structure or just opd_id linking?
            // Or just list branches and pick the one with 40 rooms (likely the real one)
            const branchRes = await pool.query(`SELECT branch_id, branch_name, consultation_rooms FROM branches ORDER BY consultation_rooms DESC LIMIT 1`);
            if (branchRes.rows.length > 0) {
                branchId = branchRes.rows[0].branch_id;
                console.log(`Fallback: Picked largest branch: ${branchRes.rows[0].branch_name} (ID: ${branchId})`);
            }
        }

        if (!branchId) {
            console.log('Could not determine branch.');
            return;
        }

        // 2. Update the branch
        console.log(`Updating MLC Fee for Branch ID ${branchId} to 100...`);
        const updateRes = await pool.query(`
            UPDATE branches 
            SET mlc_fee = 100 
            WHERE branch_id = $1 
            RETURNING *
        `, [branchId]);

        if (updateRes.rows.length > 0) {
            console.log('✅ Success! Branch updated:', updateRes.rows[0]);
        } else {
            console.log('❌ Failed to update branch.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
findAndUpdate();
