const db = require('../config/db');

async function up() {
    try {
        console.log('Altering constraint on billing_setup_master...');

        // Drop existing constraint
        await db.query(`ALTER TABLE billing_setup_master DROP CONSTRAINT IF EXISTS billing_setup_master_type_of_service_check`);

        // Add new constraint with expanded values
        // values: 'service', 'package' (legacy), 'lab_test', 'scan', 'procedure'
        await db.query(`
            ALTER TABLE billing_setup_master 
            ADD CONSTRAINT billing_setup_master_type_of_service_check 
            CHECK (type_of_service IN ('service', 'package', 'lab_test', 'scan', 'procedure', 'can_procedure'))
        `);

        console.log('Constraint updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

up();
