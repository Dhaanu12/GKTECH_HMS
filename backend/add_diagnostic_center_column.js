const db = require('./config/db');

async function addColumn() {
    try {
        const client = await db.getClient();
        await client.query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS diagnostic_center VARCHAR(255);
        `);
        console.log("Successfully added 'diagnostic_center' column to 'consultation_outcomes' table.");
        client.release();
        process.exit(0);
    } catch (err) {
        console.error("Error adding column:", err);
        process.exit(1);
    }
}

addColumn();
