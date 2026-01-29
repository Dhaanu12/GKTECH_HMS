/**
 * Migration: Create Prescription Templates Tables
 * 
 * Creates:
 * 1. prescription_templates - Master template definitions
 * 2. template_medications - Medications within each template
 * 3. doctor_template_usage - Track doctor's template usage for personalization
 * 4. drug_interaction_rules - Drug interaction safety rules
 */

const { query, pool } = require('../config/db');

async function createPrescriptionTemplatesTables() {
    const client = await pool.connect();

    try {
        console.log('🔄 Creating Prescription Templates tables...');

        await client.query('BEGIN');

        // 1. prescription_templates table
        await client.query(`
            CREATE TABLE IF NOT EXISTS prescription_templates (
                template_id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                diagnosis_keywords TEXT[],
                diagnosis_name VARCHAR(200) NOT NULL,
                description TEXT,
                specialty VARCHAR(100),
                is_global BOOLEAN DEFAULT true,
                doctor_id INTEGER REFERENCES doctors(doctor_id) ON DELETE CASCADE,
                branch_id INTEGER REFERENCES branches(branch_id) ON DELETE SET NULL,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created prescription_templates table');

        // 2. template_medications table
        await client.query(`
            CREATE TABLE IF NOT EXISTS template_medications (
                template_med_id SERIAL PRIMARY KEY,
                template_id INTEGER NOT NULL REFERENCES prescription_templates(template_id) ON DELETE CASCADE,
                service_id INTEGER REFERENCES medical_services(service_id) ON DELETE SET NULL,
                drug_name VARCHAR(200) NOT NULL,
                drug_strength VARCHAR(50),
                dose VARCHAR(50),
                frequency VARCHAR(100),
                duration_days INTEGER,
                duration_text VARCHAR(50),
                route VARCHAR(50) DEFAULT 'Oral',
                instructions TEXT,
                contraindicated_allergies TEXT[],
                age_min INTEGER,
                age_max INTEGER,
                is_optional BOOLEAN DEFAULT false,
                sort_order INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created template_medications table');

        // 3. doctor_template_usage table
        await client.query(`
            CREATE TABLE IF NOT EXISTS doctor_template_usage (
                usage_id SERIAL PRIMARY KEY,
                doctor_id INTEGER NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
                template_id INTEGER NOT NULL REFERENCES prescription_templates(template_id) ON DELETE CASCADE,
                patient_id INTEGER REFERENCES patients(patient_id) ON DELETE SET NULL,
                modifications JSONB,
                times_used INTEGER DEFAULT 1,
                times_modified INTEGER DEFAULT 0,
                last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(doctor_id, template_id)
            )
        `);
        console.log('✅ Created doctor_template_usage table');

        // 4. drug_interaction_rules table
        await client.query(`
            CREATE TABLE IF NOT EXISTS drug_interaction_rules (
                rule_id SERIAL PRIMARY KEY,
                drug_a VARCHAR(200) NOT NULL,
                drug_b VARCHAR(200) NOT NULL,
                interaction_type VARCHAR(50),
                severity VARCHAR(20),
                description TEXT,
                recommendation TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Created drug_interaction_rules table');

        // Create indexes for performance
        console.log('🔄 Creating indexes...');

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_diagnosis_gin 
            ON prescription_templates USING gin(diagnosis_keywords)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_specialty 
            ON prescription_templates(specialty)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_doctor 
            ON prescription_templates(doctor_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_templates_global 
            ON prescription_templates(is_global) WHERE is_global = true
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_template_meds_template 
            ON template_medications(template_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_template_meds_service 
            ON template_medications(service_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_usage_doctor 
            ON doctor_template_usage(doctor_id)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_drug_interactions_a 
            ON drug_interaction_rules(drug_a)
        `);

        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_drug_interactions_b 
            ON drug_interaction_rules(drug_b)
        `);

        console.log('✅ Created all indexes');

        // Create trigger for updated_at
        await client.query(`
            CREATE TRIGGER update_prescription_templates_updated_at 
            BEFORE UPDATE ON prescription_templates
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
        console.log('✅ Created update trigger');

        await client.query('COMMIT');

        console.log('');
        console.log('🎉 ============================================');
        console.log('   Prescription Templates tables created!');
        console.log('   Tables: prescription_templates, template_medications,');
        console.log('           doctor_template_usage, drug_interaction_rules');
        console.log('============================================');

    } catch (error) {
        await client.query('ROLLBACK');

        // Check if it's just a "already exists" error
        if (error.code === '42P07') {
            console.log('ℹ️  Tables already exist. Skipping creation.');
        } else if (error.code === '42710') {
            console.log('ℹ️  Some objects already exist. Migration may have been partially applied.');
        } else {
            console.error('❌ Error creating tables:', error);
            throw error;
        }
    } finally {
        client.release();
        await pool.end();
    }
}

// Run migration
createPrescriptionTemplatesTables()
    .then(() => {
        console.log('Migration completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    });
