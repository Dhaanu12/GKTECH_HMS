const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'hms_database',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function createAccountant() {
    const client = await pool.connect();
    try {
        console.log('🔍 Finding ACCOUNTANT role...');
        const roleRes = await client.query("SELECT role_id FROM roles WHERE role_code = 'ACCOUNTANT'");
        
        if (roleRes.rows.length === 0) {
            console.error('❌ Role ACCOUNTANT not found! Please run the setup script first.');
            process.exit(1);
        }

        const roleId = roleRes.rows[0].role_id;
        const email = 'accountant@phchms.com';
        const password = 'Accountant123!';
        const hashedPassword = await bcrypt.hash(password, 10);
        const username = 'Demo Accountant';

        console.log('👤 Creating user...');
        
        // Check if user exists
        const userCheck = await client.query("SELECT user_id FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            console.log('⚠️ User already exists. Updating password...');
            await client.query(
                "UPDATE users SET password_hash = $1, role_id = $2 WHERE email = $3",
                [hashedPassword, roleId, email]
            );
        } else {
            await client.query(
                "INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified) VALUES ($1, $2, $3, $4, true, true)",
                [username, email, hashedPassword, roleId]
            );
        }

        console.log('\n✅ Demo Accountant Created Successfuly!');
        console.log('------------------------------------------------');
        console.log(`📧 Email:    ${email}`);
        console.log(`🔑 Password: ${password}`);
        console.log('------------------------------------------------');

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        client.release();
        process.exit(0);
    }
}

createAccountant();
