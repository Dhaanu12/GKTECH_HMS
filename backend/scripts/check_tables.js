const { pool } = require('../config/db');

async function checkTables() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking existing tables...\n');

        // Check if patients table exists
        const patientsExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'patients'
            );
        `);

        if (patientsExists.rows[0].exists) {
            console.log('✅ Patients table EXISTS');

            // Get columns
            const patientsCols = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'patients'
                ORDER BY ordinal_position;
            `);

            console.log(`   └─ ${patientsCols.rows.length} columns:`);
            patientsCols.rows.forEach(col => {
                console.log(`      - ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('❌ Patients table DOES NOT EXIST');
        }

        console.log('\n');

        // Check if opd_entries table exists
        const opdExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'opd_entries'
            );
        `);

        if (opdExists.rows[0].exists) {
            console.log('✅ OPD Entries table EXISTS');

            // Get columns
            const opdCols = await client.query(`
                SELECT column_name, data_type, is_nullable, column_default
                FROM information_schema.columns 
                WHERE table_name = 'opd_entries'
                ORDER BY ordinal_position;
            `);

            console.log(`   └─ ${opdCols.rows.length} columns:`);
            opdCols.rows.forEach(col => {
                console.log(`      - ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('❌ OPD Entries table DOES NOT EXIST');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkTables();
