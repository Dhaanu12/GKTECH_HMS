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
        const hospitalId = 39;
        console.log(`Checking services for Hospital ID: ${hospitalId}`);
        const res = await pool.query("SELECT COUNT(*) FROM hospital_services WHERE hospital_id = $1", [hospitalId]);
        console.log(`Count: ${res.rows[0].count}`);

        if (parseInt(res.rows[0].count) === 0) {
            console.log('Seeding defaults for Hospital 39...');
            const branchId = 46; // From token
            const defaultServices = [
                { code: 'OPD-GEN', name: 'Consultation', desc: 'General Consultation' },
                { code: 'XRAY-01', name: 'X-Ray', desc: 'X-Ray Service' },
                { code: 'LAB-BLOOD', name: 'Blood Test', desc: 'Blood Test Service' },
                { code: 'SURG-GEN', name: 'General Surgery', desc: 'General Surgery' }
            ];

            for (const svc of defaultServices) {
                await pool.query(`
                    INSERT INTO hospital_services 
                    (uuid, hospital_id, branch_id, service_code, service_name, service_description, is_active, created_by, created_at, updated_at)
                    VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, true, '139', NOW(), NOW())
                `, [hospitalId, branchId, svc.code, svc.name, svc.desc]);
            }
            console.log('Seeded.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
