const db = require('./config/db');

async function fixPatientsSequence() {
    try {
        const client = await db.getClient();

        // Fix the sequence for patients
        await client.query(`
            SELECT setval(
                pg_get_serial_sequence('patients', 'patient_id'),
                COALESCE((SELECT MAX(patient_id) FROM patients), 1),
                true
            );
        `);

        console.log('✅ Successfully reset patients sequence');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing sequence:', err);
        process.exit(1);
    }
}

fixPatientsSequence();
