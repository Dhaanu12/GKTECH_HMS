/**
 * Seed Prescription Templates
 * 
 * Creates initial set of global prescription templates for common conditions.
 * Run after create_prescription_templates.js migration.
 */

const { query, pool } = require('../config/db');

const TEMPLATES = [
    {
        name: 'Fever - General',
        diagnosis_name: 'Fever / Pyrexia',
        diagnosis_keywords: ['fever', 'pyrexia', 'viral fever', 'temperature', 'high temperature'],
        description: 'Standard treatment for viral fever with supportive care',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Paracetamol', drug_strength: '500mg', dose: '1 tablet', frequency: '3 times a day', duration_days: 3, duration_text: '3 days', route: 'Oral', instructions: 'Take after food' },
            { drug_name: 'Cetirizine', drug_strength: '10mg', dose: '1 tablet', frequency: 'Once daily at night', duration_days: 5, duration_text: '5 days', route: 'Oral', instructions: 'Take at bedtime' },
            { drug_name: 'ORS Powder', drug_strength: null, dose: '1 sachet', frequency: 'After each loose stool', duration_days: 3, route: 'Oral', instructions: 'Dissolve in 1 liter water', is_optional: true }
        ]
    },
    {
        name: 'Upper Respiratory Infection',
        diagnosis_name: 'Upper Respiratory Tract Infection (URTI)',
        diagnosis_keywords: ['urti', 'cold', 'common cold', 'cough', 'sore throat', 'pharyngitis', 'rhinitis'],
        description: 'Treatment for common cold and throat infections',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Azithromycin', drug_strength: '500mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 3, duration_text: '3 days', route: 'Oral', instructions: 'Take 1 hour before food', contraindicated_allergies: ['macrolide', 'azithromycin'] },
            { drug_name: 'Paracetamol', drug_strength: '500mg', dose: '1 tablet', frequency: '3 times a day', duration_days: 3, route: 'Oral', instructions: 'Take after food for fever/pain' },
            { drug_name: 'Dextromethorphan + Phenylephrine Syrup', drug_strength: null, dose: '10ml', frequency: '3 times a day', duration_days: 5, route: 'Oral', instructions: 'For cough and congestion' },
            { drug_name: 'Vitamin C', drug_strength: '500mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 7, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'Gastritis / Acidity',
        diagnosis_name: 'Gastritis / Acid Peptic Disease',
        diagnosis_keywords: ['gastritis', 'acidity', 'acid reflux', 'gerd', 'heartburn', 'epigastric pain', 'dyspepsia'],
        description: 'Treatment for acid-related stomach issues',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Pantoprazole', drug_strength: '40mg', dose: '1 tablet', frequency: 'Once daily before breakfast', duration_days: 14, duration_text: '2 weeks', route: 'Oral', instructions: 'Take 30 min before food' },
            { drug_name: 'Domperidone', drug_strength: '10mg', dose: '1 tablet', frequency: '3 times a day before meals', duration_days: 7, route: 'Oral' },
            { drug_name: 'Antacid Gel (Aluminium + Magnesium)', drug_strength: null, dose: '15ml', frequency: 'After meals and at bedtime', duration_days: 7, route: 'Oral', instructions: 'Shake well before use' }
        ]
    },
    {
        name: 'Acute Diarrhea',
        diagnosis_name: 'Acute Gastroenteritis / Diarrhea',
        diagnosis_keywords: ['diarrhea', 'loose stools', 'gastroenteritis', 'food poisoning', 'acute diarrhoea'],
        description: 'Treatment for acute diarrhea with rehydration',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'ORS Powder', drug_strength: null, dose: '1 sachet', frequency: 'After each loose stool', duration_days: 3, route: 'Oral', instructions: 'Dissolve in 1 liter water' },
            { drug_name: 'Loperamide', drug_strength: '2mg', dose: '2 capsules initially, then 1 after each loose stool', frequency: 'Max 8 capsules/day', duration_days: 2, route: 'Oral', age_min: 12 },
            { drug_name: 'Zinc Sulphate', drug_strength: '20mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 10, route: 'Oral', instructions: 'Important for recovery' },
            { drug_name: 'Probiotics (Lactobacillus)', drug_strength: null, dose: '1 capsule', frequency: 'Twice daily', duration_days: 5, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'Hypertension - First Line',
        diagnosis_name: 'Essential Hypertension',
        diagnosis_keywords: ['hypertension', 'high blood pressure', 'htn', 'elevated bp', 'high bp'],
        description: 'First-line treatment for mild-moderate hypertension',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Amlodipine', drug_strength: '5mg', dose: '1 tablet', frequency: 'Once daily in morning', duration_days: 30, duration_text: '1 month', route: 'Oral', instructions: 'Regular monitoring required' },
            { drug_name: 'Telmisartan', drug_strength: '40mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 30, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'Type 2 Diabetes - Mild',
        diagnosis_name: 'Type 2 Diabetes Mellitus',
        diagnosis_keywords: ['diabetes', 'dm', 'type 2 diabetes', 'sugar', 'high sugar', 'hyperglycemia'],
        description: 'Initial treatment for newly diagnosed T2DM',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Metformin', drug_strength: '500mg', dose: '1 tablet', frequency: 'Twice daily with meals', duration_days: 30, duration_text: '1 month', route: 'Oral', instructions: 'Take with food to reduce stomach upset' },
            { drug_name: 'Glimepiride', drug_strength: '1mg', dose: '1 tablet', frequency: 'Once daily before breakfast', duration_days: 30, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'UTI - Uncomplicated',
        diagnosis_name: 'Urinary Tract Infection (Uncomplicated)',
        diagnosis_keywords: ['uti', 'urinary infection', 'cystitis', 'burning urination', 'dysuria', 'urinary tract infection'],
        description: 'Treatment for uncomplicated lower UTI',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Nitrofurantoin', drug_strength: '100mg', dose: '1 capsule', frequency: 'Twice daily', duration_days: 5, duration_text: '5 days', route: 'Oral', instructions: 'Take with food' },
            { drug_name: 'Paracetamol', drug_strength: '500mg', dose: '1 tablet', frequency: '3 times a day as needed', duration_days: 3, route: 'Oral', instructions: 'For pain/discomfort' },
            { drug_name: 'Citralka Syrup', drug_strength: null, dose: '15ml', frequency: 'Thrice daily diluted in water', duration_days: 7, route: 'Oral', instructions: 'Dilute in half glass of water' }
        ]
    },
    {
        name: 'Headache / Migraine',
        diagnosis_name: 'Headache / Migraine',
        diagnosis_keywords: ['headache', 'migraine', 'tension headache', 'head pain', 'cephalalgia'],
        description: 'Treatment for acute headache and migraine',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Paracetamol', drug_strength: '500mg', dose: '1-2 tablets', frequency: 'Every 4-6 hours as needed', duration_days: 3, route: 'Oral', instructions: 'Max 8 tablets per day' },
            { drug_name: 'Naproxen', drug_strength: '250mg', dose: '1 tablet', frequency: 'Twice daily', duration_days: 3, route: 'Oral', contraindicated_allergies: ['nsaid', 'aspirin'] },
            { drug_name: 'Domperidone', drug_strength: '10mg', dose: '1 tablet', frequency: 'Before meals if nausea', duration_days: 3, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'Allergic Rhinitis',
        diagnosis_name: 'Allergic Rhinitis',
        diagnosis_keywords: ['allergic rhinitis', 'hay fever', 'nasal allergy', 'sneezing', 'runny nose', 'allergic cold'],
        description: 'Treatment for seasonal/perennial allergic rhinitis',
        specialty: 'General Medicine',
        medications: [
            { drug_name: 'Cetirizine', drug_strength: '10mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 14, duration_text: '2 weeks', route: 'Oral', instructions: 'Can cause drowsiness' },
            { drug_name: 'Fluticasone Nasal Spray', drug_strength: '50mcg', dose: '2 sprays each nostril', frequency: 'Once daily', duration_days: 14, route: 'Nasal', instructions: 'Prime before first use' },
            { drug_name: 'Montelukast', drug_strength: '10mg', dose: '1 tablet', frequency: 'Once daily at bedtime', duration_days: 14, route: 'Oral', is_optional: true }
        ]
    },
    {
        name: 'Skin Allergy / Urticaria',
        diagnosis_name: 'Urticaria / Skin Allergy',
        diagnosis_keywords: ['urticaria', 'hives', 'skin allergy', 'itching', 'rash', 'allergic rash', 'pruritus'],
        description: 'Treatment for acute urticaria and skin allergies',
        specialty: 'Dermatology',
        medications: [
            { drug_name: 'Levocetirizine', drug_strength: '5mg', dose: '1 tablet', frequency: 'Once daily', duration_days: 7, route: 'Oral' },
            { drug_name: 'Calamine Lotion', drug_strength: null, dose: 'Apply thin layer', frequency: 'Twice daily', duration_days: 7, route: 'Topical', instructions: 'Apply to affected areas' },
            { drug_name: 'Prednisolone', drug_strength: '5mg', dose: '2 tablets', frequency: 'Once daily after breakfast', duration_days: 5, route: 'Oral', instructions: 'Only if severe symptoms', is_optional: true }
        ]
    }
];

async function seedPrescriptionTemplates() {
    const client = await pool.connect();

    try {
        console.log('🔄 Seeding prescription templates...');

        await client.query('BEGIN');

        for (const template of TEMPLATES) {
            // Check if template already exists
            const existing = await client.query(`
                SELECT template_id FROM prescription_templates 
                WHERE name = $1 AND is_global = true
            `, [template.name]);

            if (existing.rows.length > 0) {
                console.log(`⏭️  Template "${template.name}" already exists, skipping...`);
                continue;
            }

            // Insert template
            const templateResult = await client.query(`
                INSERT INTO prescription_templates (
                    name, diagnosis_name, diagnosis_keywords, description,
                    specialty, is_global, is_active
                ) VALUES ($1, $2, $3, $4, $5, true, true)
                RETURNING template_id
            `, [
                template.name,
                template.diagnosis_name,
                template.diagnosis_keywords,
                template.description,
                template.specialty
            ]);

            const templateId = templateResult.rows[0].template_id;

            // Insert medications
            for (let i = 0; i < template.medications.length; i++) {
                const med = template.medications[i];
                await client.query(`
                    INSERT INTO template_medications (
                        template_id, drug_name, drug_strength, dose,
                        frequency, duration_days, duration_text, route,
                        instructions, contraindicated_allergies,
                        age_min, age_max, is_optional, sort_order
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
                `, [
                    templateId,
                    med.drug_name,
                    med.drug_strength || null,
                    med.dose || null,
                    med.frequency || null,
                    med.duration_days || null,
                    med.duration_text || null,
                    med.route || 'Oral',
                    med.instructions || null,
                    med.contraindicated_allergies || [],
                    med.age_min || null,
                    med.age_max || null,
                    med.is_optional || false,
                    i
                ]);
            }

            console.log(`✅ Created template: ${template.name} (${template.medications.length} medications)`);
        }

        await client.query('COMMIT');

        // Get count
        const countResult = await client.query(`SELECT COUNT(*) from prescription_templates`);
        const medCountResult = await client.query(`SELECT COUNT(*) from template_medications`);

        console.log('');
        console.log('🎉 ============================================');
        console.log(`   Seeded ${countResult.rows[0].count} prescription templates`);
        console.log(`   With ${medCountResult.rows[0].count} total medications`);
        console.log('============================================');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Error seeding templates:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run seeding
seedPrescriptionTemplates()
    .then(() => {
        console.log('Seeding completed.');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Seeding failed:', error);
        process.exit(1);
    });
