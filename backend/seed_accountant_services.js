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
        console.log('--- Seeding Services for Accountants ---');

        // standard services to seed
        const defaultServices = [
            { code: 'OPD-GEN', name: 'Consultation', desc: 'General Consultation' },
            { code: 'XRAY-01', name: 'X-Ray', desc: 'X-Ray Service' },
            { code: 'LAB-BLOOD', name: 'Blood Test', desc: 'Blood Test Service' },
            { code: 'SURG-GEN', name: 'General Surgery', desc: 'General Surgery' }
        ];

        // Find accountants and their hospitals
        const users = await pool.query(`
            SELECT DISTINCT b.hospital_id, h.hospital_name, sb.branch_id
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN staff s ON u.user_id = s.user_id
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE r.role_code = 'ACCOUNTANT'
        `);

        for (const row of users.rows) {
            const { hospital_id, hospital_name, branch_id } = row;
            console.log(`Checking Hospital: ${hospital_name} (ID: ${hospital_id})`);

            const check = await pool.query("SELECT COUNT(*) FROM hospital_services WHERE hospital_id = $1", [hospital_id]);
            if (parseInt(check.rows[0].count) === 0) {
                console.log(`  > No services found. Seeding defaults...`);

                for (const svc of defaultServices) {
                    await pool.query(`
                        INSERT INTO hospital_services 
                        (uuid, hospital_id, branch_id, service_code, service_name, service_description, is_active, created_by, created_at, updated_at)
                        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, 1, NOW(), NOW())
                    `, [hospital_id, branch_id, svc.code, svc.name, svc.desc]);
                }
                console.log(`  > Seeded ${defaultServices.length} services.`);
            } else {
                console.log(`  > Services exist (${check.rows[0].count}). Skipping.`);
            }
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

run();
