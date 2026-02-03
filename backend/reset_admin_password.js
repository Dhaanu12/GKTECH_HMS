const { Client } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: 'hms_database'
};

async function resetAdminPassword() {
    console.log('Resetting Super Admin password and unlocking account...');

    const client = new Client(dbConfig);

    try {
        await client.connect();
        console.log('Connected to hms_database.');

        const email = 'admin@phchms.com';
        const password = 'Admin123!';
        
        // Generate fresh hash
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        
        console.log(`Generated new hash for '${password}'`);

        // Update user
        const query = `
            UPDATE users 
            SET password_hash = $1,
                login_attempts = 0,
                locked_until = NULL,
                is_active = true
            WHERE email = $2
            RETURNING user_id, username, email;
        `;
        
        const res = await client.query(query, [passwordHash, email]);
        
        if (res.rowCount > 0) {
            console.log('Successfully updated user:', res.rows[0]);
        } else {
            console.log('User not found!');
        }

    } catch (err) {
        console.error('Error resetting password:', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

resetAdminPassword();
