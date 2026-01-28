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
        const branchId = 46;
        const tenantId = 39; // Check both or just tenant_id as per recent fix

        console.log('--- 1. Checking Active Services & Codes (Branch 46) ---');
        const services = await pool.query(`
            SELECT s.service_name, s.service_code 
            FROM services s
            JOIN branch_services bs ON s.service_id = bs.service_id
            WHERE bs.branch_id = $1 AND bs.is_active = true
        `, [branchId]);
        console.table(services.rows);

        console.log('\n--- 2. Checking Doctors & Their Percentages ---');
        // Fetch doctors in this tenant
        const doctors = await pool.query(`
            SELECT id, doctor_name, medical_council_membership_number as mci, tenant_id
            FROM referral_doctor_module
            WHERE tenant_id = $1
        `, [tenantId]);

        console.log(`Found ${doctors.rows.length} doctors.`);

        for (const doc of doctors.rows) {
            console.log(`\nDoctor: ${doc.doctor_name} (ID: ${doc.id}, MCI: ${doc.mci})`);
            const pcts = await pool.query(`
                SELECT service_type, cash_percentage, inpatient_percentage, referral_pay
                FROM referral_doctor_service_percentage_module
                WHERE referral_doctor_id = $1
            `, [doc.id]);

            if (pcts.rows.length === 0) {
                console.log('  > No percentages configured.');
            } else {
                console.table(pcts.rows);
                // Verify match with service codes
                pcts.rows.forEach(p => {
                    const match = services.rows.find(s => s.service_name === p.service_type || s.service_code === p.service_type);
                    if (!match) {
                        console.log(`  > WARNING: Configured service '${p.service_type}' matches NO active service code/name!`);
                    } else {
                        console.log(`  > OK: '${p.service_type}' matches ${match.service_name} (${match.service_code})`);
                    }
                });
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
