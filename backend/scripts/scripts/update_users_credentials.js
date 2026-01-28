const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function updateCredentials() {
    let client;
    try {
        console.log('Connecting to database...');
        client = await db.getClient();
        await client.query('BEGIN');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('1234', salt);

        // Update Marketing Executive
        console.log('Updating Marketing Executive credentials...');
        const marketingResult = await client.query(
            `UPDATE users 
             SET email = $1, password_hash = $2 
             WHERE email = $3 
             RETURNING user_id, username, email`,
            ['marketingexec@care24.com', hashedPassword, 'Pavan@sunriseh.com']
        );

        if (marketingResult.rowCount > 0) {
            console.log('Successfully updated Marketing Executive:', marketingResult.rows[0]);
        } else {
            console.log('Warning: User "Pavan@sunriseh.com" not found.');
            // Try to see if the new email already exists to avoid confusion
            const check = await client.query('SELECT * FROM users WHERE email = $1', ['marketingexec@care24.com']);
            if (check.rowCount > 0) {
                console.log('User "marketingexec@care24.com" already exists. Updating password only.');
                await client.query(
                    `UPDATE users SET password_hash = $1 WHERE email = $2`,
                    [hashedPassword, 'marketingexec@care24.com']
                );
            }
        }

        // Update Accountant
        console.log('Updating Accountant credentials...');
        const accountantResult = await client.query(
            `UPDATE users 
             SET email = $1, password_hash = $2 
             WHERE email = $3 
             RETURNING user_id, username, email`,
            ['accounts@care24.com', hashedPassword, 'accountant@phchms.com']
        );

        if (accountantResult.rowCount > 0) {
            console.log('Successfully updated Accountant:', accountantResult.rows[0]);
        } else {
            console.log('Warning: User "accountant@phchms.com" not found.');
            // Try to see if the new email already exists
            const check = await client.query('SELECT * FROM users WHERE email = $1', ['accounts@care24.com']);
            if (check.rowCount > 0) {
                console.log('User "accounts@care24.com" already exists. Updating password only.');
                await client.query(
                    `UPDATE users SET password_hash = $1 WHERE email = $2`,
                    [hashedPassword, 'accounts@care24.com']
                );
            }
        }

        await client.query('COMMIT');
        console.log('Transaction committed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating credentials:', error);
    } finally {
        if (client) client.release();
        // Close the pool to allow the script to exit
        // Note: db.query uses a pool, db.getClient returns a client from the pool.
        // There isn't a direct way to close the pool exported from config/db.js usually unless we can access the pool instance.
        // We will just exit the process.
        process.exit(0);
    }
}

updateCredentials();
