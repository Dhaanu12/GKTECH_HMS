const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function testQuery() {
    try {
        let query = `
            SELECT rdm.*, 
                   ra.name as referral_agent_name, 
                   rd_ref.doctor_name as referrer_doctor_name,
                   CONCAT(s.first_name, ' ', s.last_name) as created_by_name
            FROM referral_doctor_module rdm
            LEFT JOIN referral_agents ra ON rdm.referral_means = 'Agent' AND rdm.means_id = ra.id
            LEFT JOIN referral_doctor_module rd_ref ON rdm.referral_means = 'Doctor' AND rdm.means_id = rd_ref.id
            LEFT JOIN users u ON (rdm.created_by = u.username OR rdm.created_by = CAST(u.user_id AS VARCHAR))
            LEFT JOIN staff s ON u.user_id = s.user_id
            WHERE 1=1
        `;
        // Simulate no filters first
        const result = await pool.query(query);
        console.log('Query successful! Rows:', result.rows.length);
        if (result.rows.length > 0) {
            console.log('Sample row:', result.rows[0]);
        }
    } catch (err) {
        console.error('Query Error:', err);
    } finally {
        pool.end();
    }
}

testQuery();
