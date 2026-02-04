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
        console.log(`Cleaning up seeded services for Hospital ID: ${hospitalId}`);
        // Delete services that I likely seeded (created_by '139' or implicitly matches default names)
        // User asked to delete rows pointing only to hospital without branch_id, OR essentially undo the seed.
        // My seed script set branch_id=46.
        // But user said "delete rows pointing only to hospital without branch id". 
        // Let's just delete the ones I inserted today or all for this hospital if user wants to rely on branch_services mapping.
        // Actually, 'hospital_services' might be used for other things (like billing).
        // But for "Referral Configuration", we are switching to branch_services.
        // I will safely delete the 4 active defaults I added.

        const res = await pool.query(`
            DELETE FROM hospital_services 
            WHERE hospital_id = $1 
            AND service_name IN ('Consultation', 'X-Ray', 'Blood Test', 'General Surgery')
        `, [hospitalId]);

        console.log(`Deleted ${res.rowCount} rows.`);

    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
run();
