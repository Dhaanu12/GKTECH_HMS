const { pool } = require('../config/db');

async function fixAllSequences() {
    const client = await pool.connect();
    try {
        console.log('🔧 Fixing all database sequences...\n');

        // Get all tables with serial columns automatically
        const tablesQuery = `
            SELECT 
                t.table_name,
                c.column_name,
                pg_get_serial_sequence(t.table_name, c.column_name) as sequence_name
            FROM information_schema.tables t
            JOIN information_schema.columns c 
                ON t.table_name = c.table_name
            WHERE t.table_schema = 'public'
                AND t.table_type = 'BASE TABLE'
                AND c.column_default LIKE 'nextval%'
            ORDER BY t.table_name;
        `;

        const result = await client.query(tablesQuery);

        console.log(`Found ${result.rows.length} tables with sequences\n`);

        for (const row of result.rows) {
            const { table_name, column_name, sequence_name } = row;

            try {
                // Get current max ID
                const maxResult = await client.query(
                    `SELECT COALESCE(MAX(${column_name}), 0) as max_id FROM ${table_name}`
                );
                const maxId = maxResult.rows[0].max_id;

                if (sequence_name) {
                    // Get current sequence value
                    const currentSeqResult = await client.query(
                        `SELECT last_value FROM ${sequence_name}`
                    );
                    const currentSeq = currentSeqResult.rows[0].last_value;

                    // Reset the sequence if needed
                    const newSeqValue = maxId + 1;

                    if (currentSeq < newSeqValue) {
                        await client.query(`SELECT setval($1, $2, false)`, [sequence_name, newSeqValue]);
                        console.log(`✅ ${table_name}.${column_name}: max=${maxId}, sequence ${currentSeq} → ${newSeqValue}`);
                    } else {
                        console.log(`✓  ${table_name}.${column_name}: OK (max=${maxId}, seq=${currentSeq})`);
                    }
                }
            } catch (tableError) {
                console.log(`❌ ${table_name}.${column_name}: ${tableError.message}`);
            }
        }

        console.log('\n✅ All sequences checked and fixed!');

    } catch (error) {
        console.error('❌ Error fixing sequences:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

fixAllSequences()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
