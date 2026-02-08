require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');

async function checkDatabase() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root'
    });

    try {
        await client.connect();
        const res = await client.query('SELECT current_database()');
        console.log(`Connected to database: ${res.rows[0].current_database}`);
        console.log(`DB_NAME from env: ${process.env.DB_NAME}`);
    } catch (error) {
        console.error('❌ Error checking database:', error);
    } finally {
        await client.end();
    }
}

checkDatabase();
