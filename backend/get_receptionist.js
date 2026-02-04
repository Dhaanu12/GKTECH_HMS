const { query } = require('./config/db');

async function getReceptionist() {
    try {
        const result = await query(`
            SELECT u.email, 'password123' as password 
            FROM users u 
            JOIN roles r ON u.role_id = r.role_id 
            WHERE r.role_code = 'RECEPTIONIST' 
            LIMIT 1
        `);
        console.log('Receptionist:', result.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

getReceptionist();
