const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_db_13'
};

const targetEmail = process.argv[2];
const newPassword = process.argv[3] || 'Password123';

if (!targetEmail) {
    console.error('Usage: node reset_user_password.js <email> [new_password]');
    process.exit(1);
}

async function resetUserPassword() {
    console.log(`Resetting password for ${targetEmail}...`);

    const client = new Client(dbConfig);

    try {
        await client.connect();

        // Generate fresh hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newPassword, salt);

        // Update user
        const query = `
            UPDATE users 
            SET password_hash = $1,
                login_attempts = 0,
                locked_until = NULL
            WHERE email = $2
            RETURNING user_id, username, email;
        `;

        const res = await client.query(query, [passwordHash, targetEmail]);

        if (res.rowCount > 0) {
            console.log('✅ Successfully updated password for user:', res.rows[0].email);
            console.log(`🔑 New Password: ${newPassword}`);
        } else {
            console.log('❌ User not found!');
        }

    } catch (err) {
        console.error('Error resetting password:', err);
    } finally {
        await client.end();
    }
}

resetUserPassword();
