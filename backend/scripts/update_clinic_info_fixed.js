const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateBranchInfo() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update Branch info for branch_id 1
        await client.query(`
            UPDATE branches
            SET branch_name = 'GKTECH MEDICAL CENTRE',
                address_line1 = '#123, 4th Cross, Health City',
                address_line2 = 'Near Main Gate',
                city = 'Bengaluru',
                state = 'Karnataka',
                pincode = '560001',
                contact_number = '080-12345678, 7406455036'
            WHERE branch_id = 1
        `);

        // Also update the hospital name in hospitals table
        await client.query(`
            UPDATE hospitals
            SET hospital_name = 'GKTECH MEDICAL CENTRE'
            WHERE hospital_id = (SELECT hospital_id FROM branches WHERE branch_id = 1)
        `);

        await client.query('COMMIT');
        console.log('Branch and Hospital info updated successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Update failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}
updateBranchInfo();
