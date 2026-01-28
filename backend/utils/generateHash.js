// Quick utility to generate password hash
const bcrypt = require('bcryptjs'); // or 'bcrypt' if using that

const password = process.argv[2] || 'Admin123!';

bcrypt.hash(password, 10)
    .then(hash => {
        console.log('\n=================================');
        console.log('Password:', password);
        console.log('Hash:', hash);
        console.log('=================================\n');
        console.log('Copy this SQL to pgAdmin:\n');
        console.log(`UPDATE users SET password_hash = '${hash}', login_attempts = 0, locked_until = NULL WHERE email = 'admin@phchms.com';`);
        console.log('\n');
    })
    .catch(err => console.error('Error:', err));
