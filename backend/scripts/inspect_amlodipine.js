const db = require('../config/db');

async function inspectAmlodipine() {
    try {
        console.log('Inspecting "Amlodipine" records...');

        const query = `
            SELECT 
                m.id, 
                m.medicine_name, 
                m.generic_name, 
                m.strength, 
                m.manufacturer_id,
                mm.name as manufacturer_name,
                bm.branch_id,
                bm.is_active as is_in_branch
            FROM medication_master m
            LEFT JOIN medication_manufacturers mm ON m.manufacturer_id = mm.id
            LEFT JOIN branch_medications bm ON m.id = bm.medication_id
            WHERE m.medicine_name ILIKE '%Amlodipine%'
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

inspectAmlodipine();
