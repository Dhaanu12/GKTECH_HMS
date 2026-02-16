const db = require('../config/db');

async function checkData() {
    const client = await db.getClient();
    try {
        console.log('--- Checking Medication Data ---');

        // 1. Count Manufacturers
        const resMan = await client.query('SELECT COUNT(*) FROM medication_manufacturers');
        console.log(`Total Manufacturers: ${resMan.rows[0].count}`);

        // 2. Count Medications
        const resMed = await client.query('SELECT COUNT(*) FROM medication_master');
        console.log(`Total Medications: ${resMed.rows[0].count}`);

        // 3. Count Medications with Manufacturer
        const resMedMan = await client.query('SELECT COUNT(*) FROM medication_master WHERE manufacturer_id IS NOT NULL');
        console.log(`Medications with Manufacturer ID Linked: ${resMedMan.rows[0].count}`);

        // 4. Sample Data (Top 5)
        const resSample = await client.query(`
            SELECT m.medicine_name, m.manufacturer_id, mm.name as manufacturer_name
            FROM medication_master m
            LEFT JOIN medication_manufacturers mm ON m.manufacturer_id = mm.id
            LIMIT 5
        `);
        console.log('Sample Data (Top 5):');
        console.log(JSON.stringify(resSample.rows, null, 2));

        // 5. Check duplicate manufacturers
        const resDup = await client.query(`
            SELECT name, COUNT(*) 
            FROM medication_manufacturers 
            GROUP BY name 
            HAVING COUNT(*) > 1
        `);
        console.log('Duplicate Manufacturers:', JSON.stringify(resDup.rows, null, 2));

    } catch (err) {
        console.error('Error checking data:', err);
    } finally {
        client.release();
        process.exit();
    }
}

checkData();
