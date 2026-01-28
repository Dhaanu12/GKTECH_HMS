const { Pool } = require('pg');
const xlsx = require('xlsx');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database_v1',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

async function run() {
    try {
        console.log('Fetching services...');
        const servicesResult = await pool.query(
            "SELECT service_name FROM services WHERE status = 'Active' ORDER BY service_name"
        );
        console.log(`Found ${servicesResult.rows.length} services.`);

        const dynamicServiceColumns = servicesResult.rows.map(row => row.service_name);

        const staticColumns = [
            'PATIENT NAME',
            'ADMISSION TYPE',
            'DEPARTMENT',
            'DOCTOR NAME',
            'MEDICAL COUNCIL ID',
            'PAYMENT MODE'
        ];

        const allColumns = [...staticColumns, ...dynamicServiceColumns];

        const sampleRow = {
            'PATIENT NAME': 'John Doe',
            'ADMISSION TYPE': 'IPD',
            'DEPARTMENT': 'Cardiology',
            'DOCTOR NAME': 'Dr. Smith',
            'MEDICAL COUNCIL ID': 'MCI-12345',
            'PAYMENT MODE': 'Cash'
        };
        dynamicServiceColumns.forEach(col => sampleRow[col] = 1000);

        console.log('Creating workbook...');
        const ws = xlsx.utils.json_to_sheet([sampleRow], { header: allColumns });
        const wb = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(wb, ws, "Template");

        const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
        console.log(`Buffer created, size: ${buffer.length}`);

    } catch (error) {
        console.error('CRASH:', error);
    } finally {
        await pool.end();
    }
}

run();
