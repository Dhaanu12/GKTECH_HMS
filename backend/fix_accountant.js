const db = require('./config/db');

(async () => {
    try {
        console.log('Fixing accountant user: acc@gktech.ai\n');

        // 1. Find the accountant user
        const userResult = await db.query(`
            SELECT u.user_id, u.username, u.email
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = 'acc@gktech.ai' AND r.role_code = 'ACCOUNTANT'
        `);

        if (userResult.rows.length === 0) {
            console.log('❌ Accountant user not found!');
            process.exit(1);
        }

        const user = userResult.rows[0];
        console.log('✅ Found user:', user.email);

        // 2. Check if staff record exists
        const staffCheck = await db.query(`
            SELECT staff_id FROM staff WHERE user_id = $1
        `, [user.user_id]);

        let staffId;

        if (staffCheck.rows.length === 0) {
            console.log('📝 Creating staff record...');

            const staffCode = 'ACC' + Date.now().toString().slice(-6);
            const staffResult = await db.query(`
                INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
                VALUES ($1, 'Accountant', 'User', $2, 'Accountant', true)
                RETURNING staff_id
            `, [user.user_id, staffCode]);

            staffId = staffResult.rows[0].staff_id;
            console.log('✅ Staff record created, staff_id:', staffId);
        } else {
            staffId = staffCheck.rows[0].staff_id;
            console.log('✅ Staff record already exists, staff_id:', staffId);
        }

        // 3. Check branch assignments
        const branchCheck = await db.query(`
            SELECT * FROM staff_branches WHERE staff_id = $1
        `, [staffId]);

        if (branchCheck.rows.length === 0) {
            console.log('📝 No branch assignments found. Assigning to first active branch...');

            // Get first active branch
            const branchResult = await db.query(`
                SELECT branch_id, branch_name, hospital_id
                FROM branches
                WHERE is_active = true
                ORDER BY branch_id
                LIMIT 1
            `);

            if (branchResult.rows.length === 0) {
                console.log('❌ No active branches found!');
                process.exit(1);
            }

            const branch = branchResult.rows[0];

            await db.query(`
                INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active)
                VALUES ($1, $2, 'Permanent', true)
            `, [staffId, branch.branch_id]);

            console.log('✅ Assigned to branch:', branch.branch_name);
            console.log('   Hospital ID:', branch.hospital_id);
            console.log('   Branch ID:', branch.branch_id);
        } else {
            console.log('✅ Branch assignments already exist:');
            console.table(branchCheck.rows);
        }

        console.log('\n✅ Done! Accountant user is now properly configured.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
