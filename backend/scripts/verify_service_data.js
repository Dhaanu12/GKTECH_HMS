const db = require('../config/db');

async function checkServiceCategories() {
    try {
        console.log("Checking Medical Services for 'Bacterial', 'Brucella', 'Anti measles'...");

        // I'll search by NAME
        const query = `
            SELECT service_id, service_name, category 
            FROM medical_services 
            WHERE service_name ILIKE '%Bacterial%' 
            OR service_name ILIKE '%Brucella%' 
            OR service_name ILIKE '%Anti measles%'
        `;

        const res = await db.query(query);
        console.log("Found in Medical Services:", res.rows);

        // Also check billing setup master
        console.log("Checking Billing Setup Master for same names...");
        const query2 = `
            SELECT billing_setup_id, service_name, type_of_service as category
            FROM billing_setup_master
            WHERE service_name ILIKE '%Bacterial%' 
            OR service_name ILIKE '%Brucella%' 
            OR service_name ILIKE '%Anti measles%'
        `;
        const res2 = await db.query(query2);
        console.log("Found in Billing Setup:", res2.rows);

        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
}

checkServiceCategories();
