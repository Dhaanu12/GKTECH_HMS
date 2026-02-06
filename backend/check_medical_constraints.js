const db = require('./config/db');
async function run() {
    try {
        const query = `
            SELECT pg_get_constraintdef(c.oid) 
            FROM pg_constraint c 
            JOIN pg_class t ON c.conrelid = t.oid 
            WHERE t.relname = 'branch_medical_services' 
        `;
        const result = await db.query(query);
        console.log(result.rows);
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
run();
