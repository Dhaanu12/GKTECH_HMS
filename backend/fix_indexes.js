const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// List of indexes to create - only on columns that definitely exist
const indexes = [
    // Appointments
    { table: 'appointments', column: 'status', name: 'idx_appointments_status' },
    { table: 'appointments', column: 'patient_id', name: 'idx_appointments_patient' },
    { table: 'appointments', column: 'doctor_id', name: 'idx_appointments_doctor' },
    { table: 'appointments', column: 'appointment_date', name: 'idx_appointments_date' },

    // Billings
    { table: 'billings', column: 'payment_status', name: 'idx_billings_status' },
    { table: 'billings', column: 'patient_id', name: 'idx_billings_patient' },
    { table: 'billings', column: 'billing_date', name: 'idx_billings_date' },

    // Branches
    { table: 'branches', column: 'is_active', name: 'idx_branches_active' },

    // Consultations
    { table: 'consultations', column: 'referral_doctor_id', name: 'idx_consultations_referral' },

    // OPD
    { table: 'opd', column: 'patient_id', name: 'idx_opd_patient' },
    { table: 'opd', column: 'visit_status', name: 'idx_opd_status' },

    // Patients
    { table: 'patients', column: 'mrn_number', name: 'idx_patients_mrn' },
    { table: 'patients', column: 'contact_number', name: 'idx_patients_phone' },

    // Users
    { table: 'users', column: 'username', name: 'idx_users_username' },
    { table: 'users', column: 'role', name: 'idx_users_role' },

    // Vitals
    { table: 'vitals', column: 'patient_id', name: 'idx_vitals_patient' },
    { table: 'vitals', column: 'opd_id', name: 'idx_vitals_opd' },

    // Lab Orders
    { table: 'lab_orders', column: 'patient_id', name: 'idx_lab_orders_patient' },
    { table: 'lab_orders', column: 'status', name: 'idx_lab_orders_status' },

    // Clinical Notes
    { table: 'clinical_notes', column: 'patient_id', name: 'idx_clinical_notes_patient' },
    { table: 'clinical_notes', column: 'opd_id', name: 'idx_clinical_notes_opd' },

    // Patient Documents
    { table: 'patient_documents', column: 'patient_id', name: 'idx_patient_documents_patient' },
];

async function createIndexes() {
    const client = await pool.connect();

    try {
        console.log('🔧 Creating missing indexes...\n');

        let created = 0;
        let skipped = 0;
        let errors = 0;

        for (const index of indexes) {
            try {
                const sql = `CREATE INDEX IF NOT EXISTS ${index.name} ON ${index.table}(${index.column})`;
                await client.query(sql);
                console.log(`✓ ${index.name} on ${index.table}(${index.column})`);
                created++;
            } catch (error) {
                if (error.code === '42703') {
                    // Column doesn't exist - skip silently
                    console.log(`⊘ ${index.name} - column ${index.column} doesn't exist in ${index.table}`);
                    skipped++;
                } else if (error.code === '42P07') {
                    // Index already exists
                    console.log(`→ ${index.name} already exists`);
                    skipped++;
                } else {
                    console.log(`✗ ${index.name} - ${error.message}`);
                    errors++;
                }
            }
        }

        console.log('\n' + '─'.repeat(60));
        console.log(`\n📊 Summary:`);
        console.log(`   ✓ Created: ${created}`);
        console.log(`   → Skipped: ${skipped}`);
        console.log(`   ✗ Errors: ${errors}`);
        console.log(`   📝 Total: ${indexes.length}`);

        if (errors === 0) {
            console.log('\n✅ All indexes processed successfully!');
        } else {
            console.log('\n⚠️  Some indexes could not be created');
        }

    } catch (error) {
        console.error('\n❌ Fatal error:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

createIndexes()
    .then(() => {
        console.log('\n🎉 Index creation completed!\n');
        process.exit(0);
    })
    .catch(error => {
        console.error('\n💥 Fatal error:', error);
        process.exit(1);
    });
