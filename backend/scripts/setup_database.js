const { pool } = require('../config/db');
const fs = require('fs');
const path = require('path');

async function setupDatabaseTables() {
    const client = await pool.connect();

    try {
        console.log('🚀 Starting database table setup...\n');

        // Read the SQL file
        const sqlFilePath = path.join(__dirname, 'setup_database_tables.sql');
        const sql = fs.readFileSync(sqlFilePath, 'utf8');

        console.log('📄 Executing SQL script...\n');

        // Execute the SQL script
        await client.query(sql);

        console.log('✅ Database tables created successfully!\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');

        const patientsCheck = await client.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_name = 'patients'
        `);

        const opdCheck = await client.query(`
            SELECT COUNT(*) as count FROM information_schema.tables 
            WHERE table_name = 'opd_entries'
        `);

        if (patientsCheck.rows[0].count > 0) {
            console.log('✅ Patients table exists');

            // Get column count
            const patientsCols = await client.query(`
                SELECT COUNT(*) as count FROM information_schema.columns 
                WHERE table_name = 'patients'
            `);
            console.log(`   └─ ${patientsCols.rows[0].count} columns`);
        } else {
            console.log('❌ Patients table NOT found');
        }

        if (opdCheck.rows[0].count > 0) {
            console.log('✅ OPD Entries table exists');

            // Get column count
            const opdCols = await client.query(`
                SELECT COUNT(*) as count FROM information_schema.columns 
                WHERE table_name = 'opd_entries'
            `);
            console.log(`   └─ ${opdCols.rows[0].count} columns`);
        } else {
            console.log('❌ OPD Entries table NOT found');
        }

        // Get current counts
        console.log('\n📊 Current data:');
        const patientCount = await client.query('SELECT COUNT(*) as count FROM patients');
        const opdCount = await client.query('SELECT COUNT(*) as count FROM opd_entries');

        console.log(`   └─ Patients: ${patientCount.rows[0].count}`);
        console.log(`   └─ OPD Entries: ${opdCount.rows[0].count}`);

        console.log('\n✅ Database setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up database tables:', error);
        console.error('\nError details:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the setup
setupDatabaseTables()
    .then(() => {
        console.log('\n🎉 All done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Setup failed:', error.message);
        process.exit(1);
    });
