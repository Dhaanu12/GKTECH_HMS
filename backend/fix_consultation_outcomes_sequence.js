const db = require('./config/db');

async function fixSequence() {
    try {
        const client = await db.getClient();

        // Fix the sequence for consultation_outcomes
        await client.query(`
            SELECT setval(
                pg_get_serial_sequence('consultation_outcomes', 'outcome_id'),
                COALESCE((SELECT MAX(outcome_id) FROM consultation_outcomes), 1),
                true
            );
        `);

        console.log('✅ Successfully reset consultation_outcomes sequence');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing sequence:', err);
        process.exit(1);
    }
}

fixSequence();
