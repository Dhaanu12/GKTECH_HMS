const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'phc_hms_08',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD
});

async function updateGSTRates() {
    try {
        console.log('📝 Updating GST rates for hospital services...\n');

        // Option 1: Set all services to 0% (medical services are typically GST exempt)
        console.log('Setting all services to 0% GST (Medical services exempt)...');
        const result1 = await pool.query(
            `UPDATE hospital_services 
             SET gst_rate = 0 
             WHERE gst_rate IS NULL OR gst_rate = 0`
        );
        console.log(`✅ Updated ${result1.rowCount} services to 0% GST\n`);

        // Option 2: Set specific services to 18% GST (if they are taxable)
        // Uncomment and modify as needed
        /*
        console.log('Setting specific services to 18% GST...');
        const result2 = await pool.query(
            `UPDATE hospital_services 
             SET gst_rate = 18 
             WHERE service_code IN ('LAB-BLOOD', 'XRAY-CHEST')`
        );
        console.log(`✅ Updated ${result2.rowCount} services to 18% GST\n`);
        */

        // Display current GST rates
        console.log('📊 Current GST Rates:\n');
        const services = await pool.query(
            `SELECT service_code, service_name, gst_rate 
             FROM hospital_services 
             ORDER BY service_name`
        );

        console.table(services.rows);

        console.log('\n✅ GST rates updated successfully!');
        console.log('\nNote: In India, most medical services are GST exempt (0%)');
        console.log('Only certain services like cosmetic procedures may have 18% GST');

    } catch (error) {
        console.error('❌ Error updating GST rates:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

updateGSTRates();
