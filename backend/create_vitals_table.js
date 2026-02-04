const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

async function createPatientVitalsTable() {
    const client = await pool.connect();

    try {
        console.log('🔧 Creating patient_vitals table...\n');

        // Read the SQL file
        const sqlPath = path.join(__dirname, 'database', '016_patient_vitals.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Execute the SQL
        console.log('📝 Executing migration...');
        await client.query(sql);

        console.log('\n✅ patient_vitals table created successfully!');

        // Verify table was created
        const result = await client.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_schema = 'public'
            AND table_name = 'patient_vitals'
            ORDER BY ordinal_position;
        `);

        console.log('\n📋 Table Structure:');
        console.log('─'.repeat(60));
        result.rows.forEach(row => {
            const nullable = row.is_nullable === 'YES' ? '(nullable)' : '(required)';
            console.log(`   • ${row.column_name.padEnd(30)} ${row.data_type.padEnd(15)} ${nullable}`);
        });

        console.log('\n' + '─'.repeat(60));
        console.log(`\n✨ Total columns: ${result.rows.length}`);

    } catch (error) {
        console.error('\n❌ Error creating table:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the migration
createPatientVitalsTable()
    .then(() => {
        console.log('\n🎉 Migration completed successfully!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
