// Seed departments data
const { pool } = require('../config/db');

const departments = [
    { name: 'Cardiology', code: 'CARD', description: 'Heart and cardiovascular system care' },
    { name: 'Pediatrics', code: 'PEDI', description: 'Medical care for infants, children, and adolescents' },
    { name: 'Orthopedics', code: 'ORTH', description: 'Musculoskeletal system treatment' },
    { name: 'Neurology', code: 'NEUR', description: 'Nervous system disorders treatment' },
    { name: 'General Surgery', code: 'SURG', description: 'Surgical procedures and operations' },
    { name: 'Emergency Medicine', code: 'EMER', description: '24/7 emergency and trauma care' },
    { name: 'Radiology', code: 'RADI', description: 'Medical imaging and diagnostics' },
    { name: 'Obstetrics & Gynecology', code: 'OBGY', description: 'Women\'s health and childbirth' },
    { name: 'Dermatology', code: 'DERM', description: 'Skin, hair, and nail disorders' },
    { name: 'ENT (Otolaryngology)', code: 'ENT', description: 'Ear, nose, and throat treatment' },
    { name: 'Ophthalmology', code: 'OPHT', description: 'Eye care and vision treatment' },
    { name: 'Psychiatry', code: 'PSYC', description: 'Mental health and behavioral disorders' },
    { name: 'Internal Medicine', code: 'INTM', description: 'Adult disease prevention and treatment' },
    { name: 'Anesthesiology', code: 'ANES', description: 'Anesthesia and pain management' },
    { name: 'Oncology', code: 'ONCO', description: 'Cancer treatment and care' },
    { name: 'Nephrology', code: 'NEPH', description: 'Kidney disease treatment' },
    { name: 'Gastroenterology', code: 'GAST', description: 'Digestive system disorders' },
    { name: 'Endocrinology', code: 'ENDO', description: 'Hormone and gland disorders' },
    { name: 'Urology', code: 'UROL', description: 'Urinary tract and male reproductive system' },
    { name: 'Pulmonology', code: 'PULM', description: 'Respiratory system and lung diseases' },
    { name: 'Physiotherapy', code: 'PHYS', description: 'Physical rehabilitation and therapy' },
    { name: 'Pathology', code: 'PATH', description: 'Laboratory testing and disease diagnosis' },
    { name: 'Pharmacy', code: 'PHAR', description: 'Medication and pharmaceutical services' },
    { name: 'Intensive Care Unit (ICU)', code: 'ICU', description: 'Critical care for severe conditions' },
    { name: 'Dental', code: 'DENT', description: 'Oral and dental health care' }
];

async function seedDepartments() {
    try {
        console.log('🌱 Seeding departments...');

        for (const dept of departments) {
            const query = `
                INSERT INTO departments (department_name, department_code, description, is_active)
                VALUES ($1, $2, $3, TRUE)
                ON CONFLICT (department_code) DO NOTHING
            `;
            await pool.query(query, [dept.name, dept.code, dept.description]);
            console.log(`✓ Added: ${dept.name}`);
        }

        console.log('✅ Departments seeded successfully!');

        // Show count
        const countResult = await pool.query('SELECT COUNT(*) FROM departments');
        console.log(`📊 Total departments in database: ${countResult.rows[0].count}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding departments:', error);
        process.exit(1);
    }
}

seedDepartments();
