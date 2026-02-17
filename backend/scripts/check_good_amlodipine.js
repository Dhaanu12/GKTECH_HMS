const db = require('../config/db');

async function checkGoodAmlodipine() {
    try {
        console.log('Inspecting "Good" Amlodipine records...');

        const query = `
            SELECT id, medicine_name, generic_name, strength, manufacturer_id
            FROM medication_master
            WHERE medicine_name ILIKE '%Amlodipine%' AND generic_name IS NOT NULL
        `;

        const res = await db.query(query);
        console.table(res.rows);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkGoodAmlodipine();
