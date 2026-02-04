const db = require('./config/db');

const up = async () => {
    try {
        console.log('Updating medical_services category from can_procedure to procedure...');

        // Log count before update
        const beforeResult = await db.query(`SELECT count(*) as count FROM medical_services WHERE category = 'can_procedure'`);
        const countBefore = beforeResult.rows[0].count;
        console.log(`Found ${countBefore} records to update.`);

        if (parseInt(countBefore) > 0) {
            await db.query(`
                UPDATE medical_services 
                SET category = 'procedure' 
                WHERE category = 'can_procedure'
            `);
            console.log('Update completed successfully.');

            // Verify
            const afterResult = await db.query(`SELECT count(*) as count FROM medical_services WHERE category = 'can_procedure'`);
            console.log(`Remaining 'can_procedure' records: ${afterResult.rows[0].count}`);
        } else {
            console.log('No records found to update.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

up();
