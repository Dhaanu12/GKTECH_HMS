const { Pool } = require('pg');
require('dotenv').config({ path: 'c:\\Users\\Punith\\HMS\\GKTECH_HMS\\backend\\.env' });

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function updateClinicInfo() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Update Hospital info
        await client.query(`
            UPDATE hospitals 
            SET hospital_name = 'GKTECH MEDICAL CENTRE',
                address_line1 = '#123, 4th Cross, Health City',
                city = 'Bengaluru',
                state = 'Karnataka',
                pincode = '560001',
                contact_number = '080-12345678, 080-87654321',
                logo_url = 'logo.png'
            WHERE hospital_id = (SELECT hospital_id FROM hospitals LIMIT 1)
        `);

        // Update main Branch info
        await client.query(`
            UPDATE branches
            SET branch_name = 'GKTECH Hospital - Main Branch',
                address_line1 = '#123, 4th Cross, Health City, Bengaluru - 560001',
                contact_number = '080-12345678, 7406455036'
            WHERE branch_id = 1
        `);

        await client.query('COMMIT');
        console.log('Clinic info updated successfully!');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Update failed:', e);
    } finally {
        client.release();
        pool.end();
    }
}
updateClinicInfo();
