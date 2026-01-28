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
        console.log('--- Services Check ---');
        // Count services per hospital
        const counts = await pool.query(`
            SELECT hospital_id, COUNT(*) as service_count 
            FROM hospital_services 
            WHERE is_active = true 
            GROUP BY hospital_id
        `);
        console.log('Active Services per Hospital:', counts.rows);

        console.log('--- Accountant Users Check ---');
        // Check accountants and their hospital_ids
        const users = await pool.query(`
            SELECT u.username, b.hospital_id, h.hospital_name, COUNT(hs.hosp_service_id) as services_count
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN staff s ON u.user_id = s.user_id
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            LEFT JOIN hospital_services hs ON h.hospital_id = hs.hospital_id AND hs.is_active = true
            WHERE r.role_code = 'ACCOUNTANT' OR r.role_code = 'SUPER_ADMIN'
            GROUP BY u.username, b.hospital_id, h.hospital_name
        `);
        console.log('Accountant/Admin Users:', users.rows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
