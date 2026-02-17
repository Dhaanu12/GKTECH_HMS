const db = require('../config/db');

async function countAmlodipine() {
    try {
        console.log('Counting "Amlodipine" records...');

        const query = `
            SELECT 
                COUNT(*) as total, 
                COUNT(generic_name) as with_generic,
                SUM(CASE WHEN generic_name IS NULL THEN 1 ELSE 0 END) as without_generic
            FROM medication_master 
            WHERE medicine_name ILIKE '%Amlodipine%'
        `;

        const res = await db.query(query);
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

countAmlodipine();
