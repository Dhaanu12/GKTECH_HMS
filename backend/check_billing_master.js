require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const { Client } = require('pg');

async function checkTable() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'hms_database',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'root'
    });

    try {
        await client.connect();

        const res = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'billing_master';
        `);

        if (res.rows.length === 0) {
            console.log('❌ Table billing_master NOT found!');
        } else {
            console.log('✅ Table billing_master FOUND with ' + res.rows.length + ' columns.');
            console.log('Sample columns:');
            res.rows.slice(0, 5).forEach(row => {
                console.log(` - ${row.column_name}: ${row.data_type}`);
            });
        }

    } catch (error) {
        console.error('❌ Error checking table:', error);
    } finally {
        await client.end();
    }
}

checkTable();
