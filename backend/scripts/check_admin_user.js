const { pool } = require('../config/db');

async function checkAdminUser() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking admin user details...\n');

        // Get user with role
        const result = await client.query(`
            SELECT 
                u.user_id,
                u.username,
                u.email,
                u.is_active,
                u.login_attempts,
                u.locked_until,
                r.role_id,
                r.role_name,
                r.role_code
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.email = 'admin@phchms.com'
        `);

        if (result.rows.length === 0) {
            console.log('❌ Admin user not found!');
            return;
        }

        const user = result.rows[0];

        console.log('📋 User Details:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`User ID:        ${user.user_id}`);
        console.log(`Username:       ${user.username}`);
        console.log(`Email:          ${user.email}`);
        console.log(`Is Active:      ${user.is_active}`);
        console.log(`Login Attempts: ${user.login_attempts}`);
        console.log(`Locked Until:   ${user.locked_until || 'Not locked'}`);
        console.log(`Role ID:        ${user.role_id}`);
        console.log(`Role Name:      ${user.role_name}`);
        console.log(`Role Code:      ${user.role_code}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // Check if user_sessions table exists
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'user_sessions'
            );
        `);

        if (tableCheck.rows[0].exists) {
            console.log('\n✅ user_sessions table exists');
        } else {
            console.log('\n❌ user_sessions table DOES NOT EXIST');
            console.log('   This may cause login to fail!');
            console.log('   The login process tries to create a session.');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('\nFull error:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

checkAdminUser();
