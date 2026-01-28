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
        console.log('--- Searching for "Laparoscopic Surgeries" ---');

        // 1. Check Global Services
        const globalSvc = await pool.query("SELECT * FROM services WHERE service_name ILIKE '%Laparoscopic%'");
        console.log(`Global Services Found: ${globalSvc.rows.length}`);
        if (globalSvc.rows.length > 0) console.log(globalSvc.rows[0]);

        // 2. Check Branch Services for Branch 46 (Hospital 39)
        const branchId = 46;
        console.log(`\n--- Checking Branch Services (Branch ID: ${branchId}) ---`);
        const branchSvc = await pool.query(`
            SELECT s.service_name, bs.is_active 
            FROM branch_services bs
            JOIN services s ON bs.service_id = s.service_id
            WHERE bs.branch_id = $1
        `, [branchId]);

        console.log(`Branch Services Found: ${branchSvc.rows.length}`);
        branchSvc.rows.forEach(r => console.log(`- ${r.service_name} (${r.is_active ? 'Active' : 'Inactive'})`));

        // 3. Check Hospital Services for Hospital 39
        const hospitalId = 39;
        console.log(`\n--- Checking Hospital Services (Hospital ID: ${hospitalId}) ---`);
        const hospSvc = await pool.query("SELECT service_name FROM hospital_services WHERE hospital_id = $1", [hospitalId]);
        console.log(`Hospital Services Found: ${hospSvc.rows.length}`);
        hospSvc.rows.forEach(r => console.log(`- ${r.service_name}`));

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
