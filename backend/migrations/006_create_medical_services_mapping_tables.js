const { pool } = require('../config/db');

async function createMedicalServicesMappingTables() {
    try {
        console.log('Creating hospital_medical_services and branch_medical_services tables...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS hospital_medical_services (
                id SERIAL PRIMARY KEY,
                hospital_id INTEGER NOT NULL REFERENCES hospitals(hospital_id) ON DELETE CASCADE,
                service_id INTEGER NOT NULL REFERENCES medical_services(service_id) ON DELETE CASCADE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                created_by INTEGER,
                updated_by INTEGER,
                UNIQUE(hospital_id, service_id)
            )
        `);
        console.log('✓ hospital_medical_services table created');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS branch_medical_services (
                id SERIAL PRIMARY KEY,
                branch_id INTEGER NOT NULL REFERENCES branches(branch_id) ON DELETE CASCADE,
                service_id INTEGER NOT NULL REFERENCES medical_services(service_id) ON DELETE CASCADE,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                created_by INTEGER,
                updated_by INTEGER,
                UNIQUE(branch_id, service_id)
            )
        `);
        console.log('✓ branch_medical_services table created');

        // Create indexes for better query performance
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_hospital_medical_services_hospital 
            ON hospital_medical_services(hospital_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_hospital_medical_services_service 
            ON hospital_medical_services(service_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_branch_medical_services_branch 
            ON branch_medical_services(branch_id)
        `);

        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_branch_medical_services_service 
            ON branch_medical_services(service_id)
        `);

        console.log('✓ Indexes created');
        console.log('✅ Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating tables:', error);
        process.exit(1);
    }
}

createMedicalServicesMappingTables();
