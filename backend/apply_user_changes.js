const db = require('./config/db');

async function applyChanges() {
    const client = await db.getClient();
    try {
        console.log('Starting execution of requested DB changes...');
        await client.query('BEGIN');

        // 1. Appointments Table Modifications: Add opd_id
        console.log('Adding opd_id to appointments...');
        await client.query(`
            ALTER TABLE appointments 
            ADD COLUMN IF NOT EXISTS opd_id INTEGER REFERENCES opd_entries(opd_id) ON DELETE SET NULL;
        `);

        // 2. Appointment Status Constraint
        console.log('Recreating appointment_status_check...');
        // Drop old constraint if exists, might have different names depending on how it was created

        // Find existing constraints for appointment_status
        const constraintsRes = await client.query(`
            SELECT conname
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE conrelid = 'appointments'::regclass AND conname LIKE '%status_check%';
        `);
        for (const row of constraintsRes.rows) {
            await client.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS "${row.conname}";`);
        }

        // Let's also drop the default constraint name just in case
        await client.query(`ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_appointment_status_check;`);

        // Recreate the exact constraint requested
        await client.query(`
            ALTER TABLE appointments 
            ADD CONSTRAINT appointments_appointment_status_check 
            CHECK (appointment_status IN ('Scheduled', 'Confirmed', 'Checked-in', 'In OPD', 'Completed', 'Cancelled', 'No-show', 'Rescheduled'));
        `);

        // 3. Billing Architecture Creation
        // We know these tables already exist with a lot of detail from the migrations folder,
        // but we'll ensure the specific columns exist if by any chance they don't.
        console.log('Ensuring billing tables exist...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS billing_master (
                bill_master_id SERIAL PRIMARY KEY,
                branch_id INT REFERENCES branches(branch_id),
                opd_id INT REFERENCES opd_entries(opd_id),
                patient_id INT REFERENCES patients(patient_id),
                total_amount DECIMAL(10, 2) DEFAULT 0,
                discount_amount DECIMAL(10, 2) DEFAULT 0,
                net_amount DECIMAL(10, 2) DEFAULT 0,
                paid_amount DECIMAL(10, 2) DEFAULT 0,
                due_amount DECIMAL(10, 2) DEFAULT 0,
                payment_status VARCHAR(50) DEFAULT 'Unpaid',
                payment_method VARCHAR(50),
                status VARCHAR(50) DEFAULT 'Pending'
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS bill_details (
                bill_detail_id SERIAL PRIMARY KEY,
                bill_master_id INT REFERENCES billing_master(bill_master_id) ON DELETE CASCADE,
                item_type VARCHAR(50),
                item_id INT,
                item_name VARCHAR(255),
                quantity DECIMAL(10, 2) DEFAULT 1,
                unit_price DECIMAL(10, 2) DEFAULT 0,
                total_price DECIMAL(10, 2) DEFAULT 0,
                net_price DECIMAL(10, 2) DEFAULT 0,
                status VARCHAR(50) DEFAULT 'Pending'
            );
        `);

        await client.query('COMMIT');
        console.log('Successfully applied all database changes requested by user.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        client.release();
        process.exit(0);
    }
}

applyChanges();
