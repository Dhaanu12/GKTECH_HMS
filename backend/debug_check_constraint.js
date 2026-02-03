require('dotenv').config();
const { Client } = require('pg');

async function checkConstraint() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD
    });

    try {
        await client.connect();

        const query = `
            SELECT constraint_name, check_clause
            FROM information_schema.check_constraints
            WHERE constraint_name = 'appointments_appointment_status_check';
        `;

        const res = await client.query(query);
        console.log('--- Check Constraints ---');
        res.rows.forEach(row => {
            console.log(`${row.constraint_name}: ${row.check_clause}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.end();
    }
}

checkConstraint();
