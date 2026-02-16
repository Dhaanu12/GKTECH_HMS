const db = require('../config/db');

async function updateGenerics() {
    try {
        console.log('Updating missing generic names for Amlodipine...');

        const query = `
            UPDATE medication_master
            SET generic_name = medicine_name
            WHERE medicine_name ILIKE '%Amlodipine%' 
            AND generic_name IS NULL
            RETURNING id, medicine_name, generic_name;
        `;

        const res = await db.query(query);
        console.log(`Updated ${res.rowCount} records.`);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

updateGenerics();
