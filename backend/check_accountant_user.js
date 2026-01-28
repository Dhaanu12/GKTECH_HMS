const db = require('./config/db');

(async () => {
    try {
        console.log('Checking accountant user: acc@gktech.ai\n');

        // Find the accountant user
        const userResult = await db.query(`
            SELECT u.user_id, u.username, u.email, r.role_name, r.role_code
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = 'acc@gktech.ai'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ User acc@gktech.ai not found!');
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log('✅ User found:');
        console.table([user]);

        // Check staff record
        const staffResult = await db.query(`
            SELECT s.staff_id, s.user_id, s.first_name, s.last_name
            FROM staff s
            WHERE s.user_id = $1
        `, [user.user_id]);

        console.log('\n📋 Staff record:');
        if (staffResult.rows.length === 0) {
            console.log('❌ NO STAFF RECORD FOUND - This is the problem!');
        } else {
            console.table(staffResult.rows);

            // Check branch assignments
            const branchResult = await db.query(`
                SELECT 
                    sb.staff_branch assign_id,
                    sb.staff_id,
                    sb.branch_id,
                    b.branch_name,
                    b.hospital_id,
                    h.hospital_name,
                    sb.is_active
                FROM staff_branches sb
                JOIN branches b ON sb.branch_id = b.branch_id
                JOIN hospitals h ON b.hospital_id = h.hospital_id
                WHERE sb.staff_id = $1
            `, [staffResult.rows[0].staff_id]);

            console.log('\n🏥 Branch assignments:');
            if (branchResult.rows.length === 0) {
                console.log('❌ NO BRANCH ASSIGNMENTS - This is the problem!');
            } else {
                console.table(branchResult.rows);
            }
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
