const db = require('../config/db');

async function fixData() {
    try {
        console.log("Fixing misclassified Lab Tests in Medical Services...");

        const updates = [
            "UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%Bacterial culture%' AND category = 'scan'",
            "UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%Brucella%' AND category = 'scan'",
            "UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%Anti measles%' AND category = 'scan'",
            // Add generalized fix if daring, but sticking to screenshot items for safety
            "UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%titre%' AND category = 'scan'",
            "UPDATE medical_services SET category = 'lab_test' WHERE service_name ILIKE '%serology%' AND category = 'scan'"
        ];

        for (const sql of updates) {
            const res = await db.query(sql);
            console.log(`Executed: ${sql} -> Updated ${res.rowCount} rows`);
        }

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

fixData();
