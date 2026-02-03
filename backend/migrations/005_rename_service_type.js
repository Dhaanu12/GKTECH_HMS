const db = require('../config/db');

async function up() {
    try {
        console.log('Renaming service_type to type_of_service in billing_setup_package_details...');

        await db.query(`
            ALTER TABLE billing_setup_package_details 
            RENAME COLUMN service_type TO type_of_service;
        `);

        console.log('Column renamed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        // It might fail if column doesn't exist (if previous migration failed) or if already renamed
        process.exit(1);
    }
}

up();
