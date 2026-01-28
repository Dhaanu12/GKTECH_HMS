const db = require('../config/db');

async function migrate() {
    const client = await db.getClient();
    try {
        console.log('Starting migration...');
        await client.query('BEGIN');

        // Add missing columns if they don't exist
        const columns = [
            'doctor_name VARCHAR(255)',
            'approval_no VARCHAR(100)',
            'department VARCHAR(100)',
            'advance_amount NUMERIC(15, 2) DEFAULT 0',
            'co_pay NUMERIC(15, 2) DEFAULT 0',
            'discount NUMERIC(15, 2) DEFAULT 0',
            'approval_amount NUMERIC(15, 2) DEFAULT 0',
            'amount_received NUMERIC(15, 2) DEFAULT 0',
            'tds NUMERIC(15, 2) DEFAULT 0',
            'bank_name VARCHAR(255)',
            'transaction_date DATE',
            'utr_no VARCHAR(100)',
            // s_no, ip_no, patient_name, admission_date, discharge_date, insurance_name, bill_amount, pending_amount, remarks should already exist
        ];

        for (const colDef of columns) {
            const colName = colDef.split(' ')[0];
            // Check if column exists
            const checkRes = await client.query(`
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='insurance_claims' AND column_name=$1
            `, [colName]);

            if (checkRes.rows.length === 0) {
                console.log(`Adding column: ${colName}`);
                await client.query(`ALTER TABLE insurance_claims ADD COLUMN ${colDef}`);
            } else {
                console.log(`Column already exists: ${colName}`);
            }
        }

        await client.query('COMMIT');
        console.log('Migration completed successfully.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
    } finally {
        client.release();
        process.exit();
    }
}

migrate();
