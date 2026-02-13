const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function createDefaultAdmin() {
    const client = await pool.connect();

    try {
        console.log('🔐 Creating default admin user...\n');

        // Check if admin role exists
        let roleResult = await client.query(`
            SELECT role_id FROM roles WHERE role_code = 'ADMIN'
        `);

        let adminRoleId;

        if (roleResult.rows.length === 0) {
            console.log('📝 Creating ADMIN role...');
            const roleInsert = await client.query(`
                INSERT INTO roles (role_name, role_code, description, is_active)
                VALUES ('Administrator', 'ADMIN', 'System Administrator with full access', true)
                RETURNING role_id
            `);
            adminRoleId = roleInsert.rows[0].role_id;
            console.log(`✅ ADMIN role created with ID: ${adminRoleId}`);
        } else {
            adminRoleId = roleResult.rows[0].role_id;
            console.log(`✅ ADMIN role already exists with ID: ${adminRoleId}`);
        }

        // Check if admin user exists
        const userCheck = await client.query(`
            SELECT user_id, email FROM users WHERE email = 'admin@phchms.com'
        `);

        if (userCheck.rows.length > 0) {
            console.log('\n⚠️  Admin user already exists!');
            console.log(`   Email: ${userCheck.rows[0].email}`);
            console.log(`   User ID: ${userCheck.rows[0].user_id}`);
            console.log('\n💡 If you forgot the password, you can reset it manually.');
            return;
        }

        // Hash the password
        const password = 'Admin123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        console.log('\n👤 Creating admin user...');
        const userResult = await client.query(`
            INSERT INTO users (
                username, 
                email, 
                phone_number, 
                password_hash, 
                role_id, 
                is_active, 
                is_email_verified
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id, username, email
        `, [
            'admin',
            'admin@phchms.com',
            '9999999999',
            hashedPassword,
            adminRoleId,
            true,
            true
        ]);

        const adminUser = userResult.rows[0];

        console.log('\n✅ Admin user created successfully!');
        console.log('\n📋 Login Credentials:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Email:    admin@phchms.com`);
        console.log(`   Password: Admin123!`);
        console.log(`   User ID:  ${adminUser.user_id}`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('\n🔒 Please change this password after first login!');

    } catch (error) {
        console.error('❌ Error creating admin user:', error);
        console.error('\nError details:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
createDefaultAdmin()
    .then(() => {
        console.log('\n✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Failed:', error.message);
        process.exit(1);
    });
