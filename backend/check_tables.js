const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function checkTables() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking table structures...\n');

        const tables = [
            'client_modules',
            'branches',
            'billings',
            'batch_hospital_mapping',
            'appointments',
            'consultations',
            'users'
        ];

        for (const table of tables) {
            console.log(`\n📋 Table: ${table}`);
            console.log('─'.repeat(60));

            const result = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_schema = 'public'
                AND table_name = $1
                ORDER BY ordinal_position;
            `, [table]);

            if (result.rows.length === 0) {
                console.log(`   ⚠️  Table does not exist`);
            } else {
                result.rows.forEach(row => {
                    console.log(`   • ${row.column_name} (${row.data_type})`);
                });
            }
        }

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTables();
