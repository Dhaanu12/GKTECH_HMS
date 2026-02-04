const db = require('./config/db');
async function run() {
    try {
        const query = `
            SELECT pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class t ON c.conrelid = t.oid 
            WHERE t.relname = 'branch_services' 
            AND c.conname = 'branch_services_service_id_fkey'
        `;
        const result = await db.query(query);
        console.log(result.rows[0]?.pg_get_constraintdef);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
