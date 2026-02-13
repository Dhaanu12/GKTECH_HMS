const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
    const client = await pool.connect();

    try {
        console.log('🔐 Resetting admin password...\n');

        // Check if admin user exists
        const userCheck = await client.query(`
            SELECT user_id, email, username FROM users WHERE email = 'admin@phchms.com'
        `);

        if (userCheck.rows.length === 0) {
            console.log('❌ Admin user not found!');
            console.log('   Run create_admin_user.js first to create the admin user.');
            return;
        }

        const adminUser = userCheck.rows[0];
        console.log(`✅ Found admin user: ${adminUser.email} (ID: ${adminUser.user_id})`);

        // Hash the new password
        const newPassword = 'Admin123!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password and reset login attempts
        await client.query(`
            UPDATE users 
            SET 
                password_hash = $1,
                login_attempts = 0,
                locked_until = NULL,
                is_active = true,
                updated_at = CURRENT_TIMESTAMP
            WHERE user_id = $2
        `, [hashedPassword, adminUser.user_id]);

        console.log('\n✅ Password reset successfully!');
        console.log('\n📋 Updated Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Email:    admin@phchms.com`);
        console.log(`   Password: Admin123!`);
        console.log(`   Username: ${adminUser.username}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n✅ Account unlocked and activated');
        console.log('✅ Login attempts reset to 0');
        console.log('\n🔒 You can now login with these credentials!');

    } catch (error) {
        console.error('❌ Error resetting password:', error);
        console.error('\nError details:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
resetAdminPassword()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
