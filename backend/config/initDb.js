const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./db');

async function initializeDatabase() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking database initialization...');

        // Check if tables exist
        const tableCheck = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        const tablesExist = tableCheck.rows[0].exists;

        if (tablesExist) {
            console.log('✅ Database already initialized');
            return;
        }

        console.log('📦 Initializing database for first time...');

        // Read and execute SQL files in order
        const sqlFiles = [
            'database/schema.sql',
            'database/auth_tables.sql',
            'database/seed_data.sql',
            'database/create_super_admin.sql'
        ];

        for (const sqlFile of sqlFiles) {
            const filePath = path.join(__dirname, '..', sqlFile);
            console.log(`   Running ${sqlFile}...`);

            try {
                const sql = await fs.readFile(filePath, 'utf8');
                await client.query(sql);
                console.log(`   ✓ ${sqlFile} completed`);
            } catch (error) {
                console.error(`   ✗ Error in ${sqlFile}:`, error.message);
                throw error;
            }
        }

        console.log('✅ Database initialized successfully!');
        console.log('');
        console.log('🔐 Super Admin Credentials:');
        console.log('   Email: admin@phchms.com');
        console.log('   Password: Admin123!');
        console.log('');

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

module.exports = { initializeDatabase };
