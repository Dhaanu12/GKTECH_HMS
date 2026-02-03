const db = require('../config/db');

async function inspectUsers() {
    let client;
    try {
        client = await db.getClient();
        const result = await client.query('SELECT * FROM users LIMIT 1');
        console.log('Columns:', result.fields.map(f => f.name));
        console.log('Sample row:', result.rows[0]);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        if (client) client.release();
        process.exit(0);
    }
}

inspectUsers();
