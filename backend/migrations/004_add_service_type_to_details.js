const db = require('../config/db');

async function up() {
    try {
        console.log('Adding service_type column to billing_setup_package_details...');

        await db.query(`
            ALTER TABLE billing_setup_package_details 
            ADD COLUMN IF NOT EXISTS service_type VARCHAR(50);
        `);

        console.log('Column added successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

up();
