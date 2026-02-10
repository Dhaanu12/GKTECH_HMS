require('dotenv').config({ path: 'backend/.env' });
const { query } = require('../config/db');
const User = require('../models/User');

async function debugAccess() {
    try {
        console.log('--- Debugging Receptionist Access ---');

        // 1. Find the user 'Geetha'
        // Search in staff table first because name is likely there
        console.log('Searching for staff named Geetha...');
        const staffRes = await query("SELECT * FROM staff WHERE first_name ILIKE '%Geetha%' OR last_name ILIKE '%Geetha%'");

        let userId = null;
        if (staffRes.rows.length > 0) {
            console.log('Found Staff:', staffRes.rows[0]);
            userId = staffRes.rows[0].user_id;
        } else {
            console.log('No staff found with name Geetha in staff table. Checking users table...');
            const userRes = await query("SELECT * FROM users WHERE username ILIKE '%Geetha%'");
            if (userRes.rows.length > 0) {
                console.log('Found User:', userRes.rows[0]);
                userId = userRes.rows[0].user_id;
            } else {
                console.log('No user found matching Geetha.');
                return;
            }
        }

        if (!userId) {
            console.log('User ID not resolved.');
            return;
        }

        // 2. Check Role and Branch using User.findWithRole
        console.log(`\nChecking Role/Branch for UserID: ${userId}...`);
        const userWithRole = await User.findWithRole(userId);
        console.log('UserWithRole Result:', JSON.stringify(userWithRole, null, 2));

        if (!userWithRole) {
            console.log('FAILED: User.findWithRole returned null.');
            return;
        }

        const role = userWithRole.role_code;
        console.log(`Role Code: ${role}`);
        console.log(`Is Active: ${userWithRole.is_active}`);
        console.log(`Locked Until: ${userWithRole.locked_until}`);

        const authorizedRoles = ['RECEPTIONIST', 'DOCTOR', 'NURSE', 'CLIENT_ADMIN'];
        if (authorizedRoles.includes(role)) {
            console.log('✅ Role is AUTHORIZED for /api/patients/search');
        } else {
            console.log(`❌ Role ${role} is NOT in authorized list: ${authorizedRoles.join(', ')}`);
        }

        const branchId = userWithRole.branch_id;
        console.log(`Branch ID: ${branchId}`);

        // 3. Test the Patient Query manually
        console.log('\nTesting Patient Query logic...');

        if (branchId) {
            const sql = `
                    WITH BranchPatients AS (
                        SELECT DISTINCT p.patient_id
                        FROM patients p
                        LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
                        LEFT JOIN appointments a ON p.patient_id = a.patient_id
                        WHERE (o.branch_id = $1 OR a.branch_id = $1 OR (o.opd_id IS NULL AND a.appointment_id IS NULL)) AND p.is_active = true
                    ),
                    LatestOPD AS (
                        SELECT DISTINCT ON (patient_id) *
                        FROM opd_entries
                        WHERE branch_id = $1
                        ORDER BY patient_id, visit_date DESC, visit_time DESC
                    )
                    SELECT p.patient_id, p.first_name, p.last_name
                    FROM patients p
                    JOIN BranchPatients bp ON p.patient_id = bp.patient_id
                    LEFT JOIN LatestOPD lo ON p.patient_id = lo.patient_id
                    ORDER BY p.created_at DESC
                    LIMIT 20
                `;
            const result = await query(sql, [branchId]);
            console.log(`Query returned ${result.rows.length} rows.`);
            if (result.rows.length > 0) {
                console.log('First 3 rows:', result.rows.slice(0, 3));
            } else {
                console.log('No patients found with current logic.');

                // Debug: Count patients with no history
                const noHistRes = await query(`
                    SELECT count(*) FROM patients p
                    LEFT JOIN opd_entries o ON p.patient_id = o.patient_id
                    LEFT JOIN appointments a ON p.patient_id = a.patient_id
                    WHERE o.opd_id IS NULL AND a.appointment_id IS NULL AND p.is_active = true
                `);
                console.log('Patients with NO history count:', noHistRes.rows[0]);
            }

        } else {
            console.log('Skipping specific query test because branch_id is null (Admin view logic would apply).');
        }

    } catch (error) {
        console.error('Debug script failed:', error);
    } finally {
        process.exit();
    }
}

debugAccess();
