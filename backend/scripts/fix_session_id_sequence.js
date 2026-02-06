const db = require('../config/db');

async function fixSessionSequence() {
    try {
        console.log('Starting sequence fix for user_sessions...');

        // 1. Get the maximum existing session_id
        const maxIdResult = await db.query('SELECT MAX(session_id) as max_id FROM user_sessions');
        const maxId = maxIdResult.rows[0].max_id || 0;

        console.log(`Current maximum session_id in table: ${maxId}`);

        // 2. Reset the sequence to the maximum ID
        // setval with the third argument 'true' means the next value will be maxId + 1
        const sequenceName = 'user_sessions_session_id_seq';

        // We set it to maxId, so the *next* value generated will be maxId + 1 (if is_called is true, which is implicit/default for setval(seq, val))
        // Actually, setval('seq', val) sets the current value. Next nextval() returns val+1.
        // Wait, if we use setval('seq', val, true), nextval returns val+1.
        // If we use setval('seq', val, false), nextval returns val.
        // Let's use setval('seq', maxId) -> nextval is maxId + 1. 
        // If maxId is 0 (table empty), we want next to be 1. So setval(seq, 0) -> next is 1. UNLESS minvalue is 1 and 0 is invalid?
        // Let's be safe: (SELECT setval('user_sessions_session_id_seq', (SELECT MAX(session_id) FROM user_sessions)));

        const resetQuery = `
            SELECT setval($1, COALESCE((SELECT MAX(session_id) FROM user_sessions), 0) + 1, false);
        `;
        // Explanation: If max is 600, we set val to 601, and is_called=false.
        // Next nextval() will return 601. Correct. 

        await db.query(resetQuery, [sequenceName]);

        console.log(`Sequence ${sequenceName} reset successfully.`);

        // Verification query using pg_sequences or just trusting setval
        // To verify, we can check the sequence's last_value
        const verifyQuery = `SELECT last_value FROM user_sessions_session_id_seq`;
        const verifyResult = await db.query(verifyQuery);
        console.log(`Sequence user_sessions_session_id_seq current value: ${verifyResult.rows[0].last_value}`);

        console.log('Fix applied successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error fixing sequence:', error);
        process.exit(1);
    }
}

fixSessionSequence();
