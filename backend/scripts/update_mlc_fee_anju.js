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
        // Find Dr. Anju to get the branch_id
        const doctorRes = await pool.query(`
            SELECT * FROM doctors 
            WHERE first_name ILIKE '%Anju%' OR last_name ILIKE '%Anju%'
        `);

        if (doctorRes.rows.length === 0) {
            console.log('Dr. Anju not found.');
            return;
        }

        const doctor = doctorRes.rows[0];
        console.log(`Found Doctor: ${doctor.first_name} ${doctor.last_name} (ID: ${doctor.doctor_id})`);
        console.log(`Branch ID: ${doctor.branch_id}`);

        if (!doctor.branch_id) {
            console.log('Doctor has no branch assigned. Cannot update fee.');
            return;
        }

        console.log(`Updating MLC Fee for Branch ID ${doctor.branch_id} to 100...`);

        // Update the branch MLC fee
        const updateRes = await pool.query(`
            UPDATE branches 
            SET mlc_fee = 100 
            WHERE branch_id = $1 
            RETURNING *
        `, [doctor.branch_id]);

        if (updateRes.rows.length > 0) {
            console.log('✅ Success! Branch updated:', updateRes.rows[0]);
        } else {
            console.log('❌ Failed to update branch. Branch might not exist.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        pool.end();
    }
}

updateMLCFee();
