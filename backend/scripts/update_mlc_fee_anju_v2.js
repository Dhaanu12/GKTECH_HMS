const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateMLCFee() {
    try {
        console.log('Searching for Dr. Anju...');
        // 1. Find Doctor
        const doctorRes = await pool.query(`
            SELECT * FROM doctors 
            WHERE first_name ILIKE '%Anju%' OR last_name ILIKE '%Anju%'
        `);

        if (doctorRes.rows.length === 0) {
            console.log('Dr. Anju not found in doctors table.');
            return;
        }

        const doctor = doctorRes.rows[0];
        console.log(`Found Doctor: ${doctor.first_name} ${doctor.last_name} (DoctorID: ${doctor.doctor_id}, UserID: ${doctor.user_id})`);

        if (!doctor.user_id) {
            console.log('Doctor has no user_id linked.');
            return;
        }

        // 2. Find User to get Branch
        const userRes = await pool.query(`SELECT * FROM users WHERE user_id = $1`, [doctor.user_id]);

        if (userRes.rows.length === 0) {
            console.log('User not found for this doctor.');
            return;
        }

        const user = userRes.rows[0];
        console.log(`Found User: ${user.username} (BranchID: ${user.branch_id})`);

        if (!user.branch_id) {
            console.log('User has no branch_id.');
            return;
        }

        // 3. Update Branch
        console.log(`Updating MLC Fee for Branch ID ${user.branch_id} to 100...`);
        const updateRes = await pool.query(`
            UPDATE branches 
            SET mlc_fee = 100 
            WHERE branch_id = $1 
            RETURNING *
        `, [user.branch_id]);

        if (updateRes.rows.length > 0) {
            console.log('✅ Success! Branch updated:', updateRes.rows[0]);
        } else {
            console.log('❌ Failed to update branch.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

updateMLCFee();
