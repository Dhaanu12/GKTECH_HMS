const db = require('../config/db');

async function up() {
    try {
        console.log('Dropping restrictive check constraint on billing_setup_master...');

        // Drop existing constraint
        await db.query(`ALTER TABLE billing_setup_master DROP CONSTRAINT IF EXISTS billing_setup_master_type_of_service_check`);

        console.log('Constraint dropped successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

up();
