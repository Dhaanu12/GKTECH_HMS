const db = require('./config/db');

(async () => {
    try {
        console.log('Checking accountant branch assignments...\n');

        // Check accountants and their branches
        const result = await db.query(`
            SELECT 
                u.username, 
                u.user_id, 
                r.role_name,
                s.staff_id, 
                sb.branch_id, 
                b.branch_name,
                b.hospital_id,
                h.hospital_name,
                sb.is_active as branch_assignment_active
            FROM users u 
            LEFT JOIN roles r ON u.role_id = r.role_id
            LEFT JOIN staff s ON u.user_id = s.user_id 
            LEFT JOIN staff_branches sb ON s.staff_id = sb.staff_id 
            LEFT JOIN branches b ON sb.branch_id = b.branch_id
            LEFT JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE r.role_name = 'ACCOUNTANT'
            ORDER BY u.username, b.branch_name
            LIMIT 20
        `);

        if (result.rows.length === 0) {
            console.log('No accountants found in the database.');
        } else {
            console.log('Accountants and their branch assignments:');
            console.table(result.rows);
        }

        // Check total accountants
        const totalAccountants = await db.query(`
            SELECT COUNT(*) as count 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            WHERE r.role_name = 'ACCOUNTANT'
        `);
        console.log(`\nTotal accountants: ${totalAccountants.rows[0].count}`);

        // Check total branches
        const totalBranches = await db.query(`SELECT COUNT(*) as count FROM branches WHERE is_active = true`);
        console.log(`Total active branches: ${totalBranches.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
})();
