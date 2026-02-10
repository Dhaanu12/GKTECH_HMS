const { pool } = require('./config/db');

async function checkDataTypes() {
    const client = await pool.connect();
    try {
        console.log('Checking data types...\n');

        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'staff' AND column_name = 'user_id'
        `);
        console.log('staff.user_id:', res.rows);

        const res2 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'opd_entries' AND column_name = 'checked_in_by'
        `);
        console.log('opd_entries.checked_in_by:', res2.rows);

        const res3 = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name IN ('confirmed_by', 'cancelled_by')
        `);
        console.log('appointments confirmed/cancelled_by:', res3.rows);

    } finally {
        client.release();
        process.exit(0);
    }
}

checkDataTypes();
