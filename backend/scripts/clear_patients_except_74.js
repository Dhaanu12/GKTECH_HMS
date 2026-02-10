const { pool } = require('../config/db');

async function clearPatients() {
    const client = await pool.connect();
    try {
        console.log('Starting cleanup of patient records (except ID 74)...');

        await client.query('BEGIN');

        // List of tables that reference patients and might block deletion
        // We deleting records for patients != 74

        const tables = [
            'prescriptions',
            'clinical_notes',
            'consultation_outcomes',
            'patient_feedback',
            'patient_vitals',
            'patient_documents',
            'billings', // Careful with financial data, but user asked to clear records
            'opd_entries',
            'appointments',
            // 'billing_master' // If exists and refs patients
        ];

        // Check if billing_master exists and add to list if so.
        // We can just try to delete and ignore if table doesn't exist?
        // Better to query existence or just use a try-catch block for each or check schema.
        // I'll add billing_master to the list as I saw it in schema.sql later part.
        tables.push('billing_master');

        const patientIdToKeep = 74;

        for (const table of tables) {
            try {
                console.log(`Clearing ${table} for patients != ${patientIdToKeep}...`);
                // We need to check if table has patient_id column. 
                // Most do. If not, we skip.
                // Also billing_master uses patient_id.
                const res = await client.query(`DELETE FROM ${table} WHERE patient_id != $1`, [patientIdToKeep]);
                console.log(`✅ Deleted ${res.rowCount} records from ${table}.`);
            } catch (err) {
                if (err.code === '42P01') { // undefined_table
                    console.log(`⚠️ Table ${table} does not exist, skipping.`);
                } else if (err.code === '42703') { // undefined_column
                    console.log(`⚠️ Table ${table} does not have patient_id column, skipping.`);
                } else {
                    console.error(`❌ Error clearing ${table}:`, err.message);
                    // We might want to throw here to abort transaction, but maybe some tables are not critical?
                    // If we fail to delete a child, the parent delete will fail anyway.
                    throw err;
                }
            }
        }

        console.log('Clearing patients table...');
        const res = await client.query('DELETE FROM patients WHERE patient_id != $1', [patientIdToKeep]);
        console.log(`✅ Deleted ${res.rowCount} patients.`);

        await client.query('COMMIT');
        console.log('🎉 Successfully cleared all specified patient records.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Transaction failed, rolled back:', err);
    } finally {
        client.release();
        pool.end();
    }
}

clearPatients();
