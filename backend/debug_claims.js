const { pool } = require('./config/db');

async function debug() {
    try {
        const client = await pool.connect();
        try {
            console.log('--- Insurance Claims ---');
            const claims = await client.query('SELECT claim_id, approval_no, hospital_id, branch_id FROM insurance_claims');
            if (claims.rows.length === 0) {
                console.log('No claims found.');
            } else {
                console.table(claims.rows);
            }

            console.log('\n--- Accountant Users & Assignments ---');
            const accountants = await client.query(`
                SELECT u.user_id, u.username, u.role_code 
                FROM users u 
                WHERE u.role_code IN ('ACCOUNTANT', 'ACCOUNTANT_MANAGER')
            `);

            for (const acc of accountants.rows) {
                console.log(`\nAccountant: ${acc.username} (${acc.role_code})`);
                const access = await client.query(`
                    SELECT b.hospital_id, b.branch_id, b.branch_name, h.hospital_name
                    FROM staff s 
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    JOIN hospitals h ON b.hospital_id = h.hospital_id
                    WHERE s.user_id = $1 AND sb.is_active = true
                `, [acc.user_id]);

                if (access.rows.length === 0) {
                    console.log('  No branch assignments found.');
                } else {
                    console.table(access.rows);
                }
            }

        } finally {
            client.release();
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
}

debug();
