const { query } = require('./config/db');

async function migrate() {
    try {
        console.log('Ensuring all requested columns are present...');

        // consultation_outcomes
        await query(`
            ALTER TABLE consultation_outcomes 
            ADD COLUMN IF NOT EXISTS procedures TEXT,
            ADD COLUMN IF NOT EXISTS diagnostic_center TEXT,
            ADD COLUMN IF NOT EXISTS diagnosis_data TEXT,
            ADD COLUMN IF NOT EXISTS procedures_data TEXT
        `);
        console.log('Checked consultation_outcomes columns.');

        // prescriptions
        await query(`
            ALTER TABLE prescriptions 
            ADD COLUMN IF NOT EXISTS diagnosis TEXT,
            ADD COLUMN IF NOT EXISTS procedures TEXT,
            ADD COLUMN IF NOT EXISTS medicine_name VARCHAR(255)
        `);
        // Note: If procedures was previously JSONB, this might need more handling if were converting, 
        // but ADD COLUMN IF NOT EXISTS will skip if it exists.
        // Let's check if procedures is of type TEXT in prescriptions.
        const res = await query("SELECT data_type FROM information_schema.columns WHERE table_name = 'prescriptions' AND column_name = 'procedures'");
        if (res.rows.length > 0 && res.rows[0].data_type !== 'text') {
            console.log(`Converting prescriptions.procedures from ${res.rows[0].data_type} to text...`);
            await query('ALTER TABLE prescriptions ALTER COLUMN procedures TYPE TEXT USING procedures::TEXT');
        }
        console.log('Checked prescriptions columns.');

        // lab_orders
        await query(`
            ALTER TABLE lab_orders 
            ADD COLUMN IF NOT EXISTS is_external BOOLEAN
        `);
        console.log('Checked lab_orders columns.');

        console.log('Successfully verified/added all requested columns.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
