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

const newUser = {
    username: 'pharmacist_user',
    email: 'pharmacist@hms.com', // Default email
    password: '1234r',
    role_id: 6,
    first_name: 'Pharma',
    last_name: 'Staff',
    phone_number: '9876543210',
    is_active: true,
    is_email_verified: true
};

async function createPharmacist() {
    console.log('Creating Pharmacist user...');

    const client = new Client(dbConfig);

    try {
        await client.connect();

        // 1. Check if user already exists
        const checkRes = await client.query('SELECT * FROM users WHERE email = $1', [newUser.email]);
        if (checkRes.rows.length > 0) {
            console.log(`User with email ${newUser.email} already exists.`);
            // Optional: Update password if exists? The user asked to insert.
            // I'll just proceed to insert a new one if it conflicts, or maybe append a number.
            // But let's stick to the requested logic.
            console.log('Aborting insertion to avoid duplicates. Please provide a unique email if you want another user.');
            process.exit(0);
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(newUser.password, salt);

        // 3. Insert User
        const query = `
            INSERT INTO users (
                username, email, password_hash, role_id, 
                is_active, is_email_verified, phone_number
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING user_id, username, email, role_id;
        `;

        const values = [
            newUser.username,
            newUser.email,
            passwordHash,
            newUser.role_id,
            newUser.is_active,
            newUser.is_email_verified,
            newUser.phone_number
        ];

        const res = await client.query(query, values);

        console.log('✅ Pharmacist user created successfully:', res.rows[0]);
        console.log(`📧 Email: ${newUser.email}`);
        console.log(`🔑 Password: ${newUser.password}`);

    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        await client.end();
    }
}

createPharmacist();
