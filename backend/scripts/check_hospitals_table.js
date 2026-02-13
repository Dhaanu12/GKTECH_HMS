const { pool } = require('../config/db');

async function checkHospitalsTable() {
    const client = await pool.connect();

    try {
        console.log('🔍 Checking hospitals table...\n');

        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'hospitals' 
            ORDER BY ordinal_position
        `);

        if (result.rows.length === 0) {
            console.log('❌ hospitals table does not exist!');
        } else {
            console.log('✅ hospitals table exists with columns:');
            result.rows.forEach(row => {
                console.log(`   - ${row.column_name} (${row.data_type})`);
            });

            // Check if logo column exists
            const hasLogo = result.rows.some(row => row.column_name === 'logo');
            if (!hasLogo) {
                console.log('\n⚠️  WARNING: "logo" column does NOT exist in hospitals table');
                console.log('   The User.findWithRole() query references h.logo which will cause an error!');
            }

            // Check if enabled_modules column exists
            const hasModules = result.rows.some(row => row.column_name === 'enabled_modules');
            if (!hasModules) {
                console.log('\n⚠️  WARNING: "enabled_modules" column does NOT exist in hospitals table');
                console.log('   The User.findWithRole() query references h.enabled_modules which will cause an error!');
            }
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
}

checkHospitalsTable();
