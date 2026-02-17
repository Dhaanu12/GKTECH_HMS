const db = require('../config/db');

async function deleteHeaderRow() {
    const client = await db.getClient();
    try {
        console.log('Deleting bad header row...');
        const res = await client.query("DELETE FROM medication_master WHERE medicine_name = 'medicine_name'"); // The header row name I saw in check_med_data.js
        console.log(`Deleted ${res.rowCount} row(s).`);

        // Also clean up manufacturer with name 'Manufacturer' if it exists and is not used
        // But check_med_data said "company_name" for manufacturer. 
        // Let's just stick to the medicine row for now.

    } catch (err) {
        console.error('Error deleting row:', err);
    } finally {
        client.release();
        process.exit();
    }
}

deleteHeaderRow();
