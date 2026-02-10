const db = require('./config/db');

async function checkSchemas() {
    try {
        console.log("Checking schemas...");

        const tables = ['consultation_outcomes', 'prescriptions', 'opd_entries'];

        for (const table of tables) {
            console.log(`\n--- Schema for ${table} ---`);
            const res = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = '${table}'
                ORDER BY ordinal_position;
            `);
            if (res.rows.length === 0) {
                console.log(`Table ${table} does not exist or has no columns.`);
            } else {
                res.rows.forEach(row => {
                    console.log(`${row.column_name} (${row.data_type}, ${row.is_nullable})`);
                });
            }
        }

        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkSchemas();
