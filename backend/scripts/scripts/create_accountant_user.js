const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function createAccountantUser() {
    try {
        console.log('🔍 Checking if accountant user already exists...');

        // Check if user exists
        const existingUser = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            ['accountant@phchms.com']
        );

        if (existingUser.rows.length > 0) {
            console.log('✅ Accountant user already exists!');
            console.log('Email: accountant@phchms.com');
            console.log('User ID:', existingUser.rows[0].user_id);
            return;
        }

        console.log('📝 Creating new accountant user...');

        // Hash password
        const password = 'Accountant123!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user with role_id 12 (Accountant)
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash, role_id, is_active, is_email_verified)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING user_id, username, email, role_id`,
            ['accountant', 'accountant@phchms.com', hashedPassword, 12, true, true]
        );

        console.log('✅ Accountant user created successfully!');
        console.log('User ID:', result.rows[0].user_id);
        console.log('Email: accountant@phchms.com');
        console.log('Password: Accountant123!');
        console.log('Role ID: 12');

    } catch (error) {
        console.error('❌ Error creating accountant user:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

createAccountantUser();
