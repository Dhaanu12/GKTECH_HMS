const db = require('./config/db');

async function fixOpdSequence() {
    try {
        const client = await db.getClient();

        // Fix the sequence for opd_entries
        await client.query(`
            SELECT setval(
                pg_get_serial_sequence('opd_entries', 'opd_id'),
                COALESCE((SELECT MAX(opd_id) FROM opd_entries), 1),
                true
            );
        `);

        console.log('✅ Successfully reset opd_entries sequence');

        client.release();
        process.exit(0);
    } catch (err) {
        console.error('❌ Error fixing sequence:', err);
        process.exit(1);
    }
}

fixOpdSequence();
