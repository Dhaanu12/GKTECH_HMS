require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');

async function checkPatientBranchMapping() {
    try {
        console.log('=== Checking Patient-Branch Mapping ===\n');

        // 1. Check patients table structure
        console.log('1. Checking if patients table has branch_id column:');
        const schemaRes = await query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'patients' 
            AND column_name LIKE '%branch%'
        `);
        console.log(schemaRes.rows.length > 0 ? schemaRes.rows : 'No branch-related columns found in patients table');

        // 2. Total patients
        const totalRes = await query(`SELECT COUNT(*) as count FROM patients WHERE is_active = true`);
        console.log(`\n2. Total active patients: ${totalRes.rows[0].count}`);

        // 3. Patients with NO history
        const noHistoryRes = await query(`
            SELECT COUNT(*) as count
            FROM patients p
            LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            WHERE o.opd_id IS NULL AND a.appointment_id IS NULL AND p.is_active = true
        `);
        console.log(`3. Patients with NO OPD/appointment history: ${noHistoryRes.rows[0].count}`);

        // 4. Patients by branch (through OPD/appointments)
        const branchDistRes = await query(`
            SELECT 
                COALESCE(o.branch_id, a.branch_id) as branch_id,
                COUNT(DISTINCT p.patient_id) as patient_count
            FROM patients p
            LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            WHERE (o.branch_id IS NOT NULL OR a.branch_id IS NOT NULL) AND p.is_active = true
            GROUP BY COALESCE(o.branch_id, a.branch_id)
            ORDER BY branch_id
        `);
        console.log('\n4. Patient distribution by branch (via OPD/appointments):');
        branchDistRes.rows.forEach(row => {
            console.log(`   Branch ${row.branch_id}: ${row.patient_count} patients`);
        });

        // 5. Specific check for branch 55
        console.log('\n5. Checking branch 55 specifically:');
        const branch55Res = await query(`
            SELECT COUNT(DISTINCT p.patient_id) as count
            FROM patients p
            LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            WHERE (o.branch_id = 55 OR a.branch_id = 55) AND p.is_active = true
        `);
        console.log(`   Patients with OPD/appointments at branch 55: ${branch55Res.rows[0].count}`);

        // 6. Test the FIXED query with OR condition
        console.log('\n6. Testing FIXED query (with OR for no history):');
        const fixedQueryRes = await query(`
            SELECT COUNT(DISTINCT p.patient_id) as count
            FROM patients p
            LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
            LEFT JOIN appointments a ON p.patient_id = a.patient_id
            WHERE ((o.branch_id = $1 OR a.branch_id = $1) OR (o.opd_id IS NULL AND a.appointment_id IS NULL)) AND p.is_active = true
        `, [55]);
        console.log(`   Result: ${fixedQueryRes.rows[0].count} patients`);

        // 7. Sample patients
        if (parseInt(totalRes.rows[0].count) > 0) {
            console.log('\n7. Sample patients (first 5):');
            const sampleRes = await query(`
                SELECT patient_id, first_name, last_name, created_at
                FROM patients 
                WHERE is_active = true
                ORDER BY created_at DESC
                LIMIT 5
            `);
            sampleRes.rows.forEach(p => {
                console.log(`   ${p.patient_id}: ${p.first_name} ${p.last_name} (created: ${p.created_at.toISOString().split('T')[0]})`);
            });
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkPatientBranchMapping();
