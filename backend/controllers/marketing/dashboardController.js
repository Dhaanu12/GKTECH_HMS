// ... imports
const { Pool } = require('pg');
require('dotenv').config();
const User = require('../../models/User'); // Import User model

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

// Helper to get assigned branch IDs for a user
async function getAssignedBranchIds(user) {
    const assignedBranchesQuery = `
        SELECT branch_id FROM staff_branches sb
        JOIN staff s ON sb.staff_id = s.staff_id
        WHERE s.user_id = $1 AND sb.is_active = true
    `;
    const assignedBranches = await pool.query(assignedBranchesQuery, [user.user_id]);
    return assignedBranches.rows.length > 0
        ? assignedBranches.rows.map(row => row.branch_id)
        : [user.branch_id].filter(Boolean);
}

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Dashboard Stats Request - User:', req.user);

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.user.user_id || req.user.userId || req.user.id;
        const roleCode = req.user.role_code; // Get role info
        const username = req.user.username;
        const tenantId = req.user.hospital_id || req.user.tenant_id;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID missing in token' });
        }

        const userIdStr = userId.toString();

        // --- Individual Stats (PERSONAL PERFORMANCE) ---
        // These stats must reflect ONLY what the user has done (Created By or SPOC)
        // This ensures the "Self" bar in charts is accurate.
        let referral_doctors = 0;
        let referral_patients = 0;
        let referral_agents = 0;
        // Distributions can remain broader or personal - let's keep them personal for consistency with the main cards?
        // Actually, distribution usually shows "My Pie".
        let referral_doctor_distribution = [];
        let referral_patient_distribution = [];

        // 1. Referral Doctors (Self)
        try {
            let doctorQuery = `
                SELECT COUNT(*) FROM referral_doctor_module 
                WHERE status != 'Deleted'
                AND (marketing_spoc = $1 OR created_by = $2)
            `;
            const params = [userIdStr, username || ''];

            if (tenantId) {
                doctorQuery += ` AND tenant_id = $${params.length + 1}`;
                params.push(tenantId);
            }

            const doctorResult = await pool.query(doctorQuery, params);
            referral_doctors = parseInt(doctorResult.rows[0].count);
        } catch (e) { console.error('Error fetching doctors count:', e); }

        // 2. Referral Patients (Self)
        try {
            let patientQuery = `
                SELECT COUNT(*) FROM referral_patients rp
                LEFT JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
                WHERE (rp.marketing_spoc = $1 OR rp.created_by = $2)
            `;
            const params = [userIdStr, username || ''];

            if (tenantId) {
                patientQuery += ` AND (rp.tenant_id = $${params.length + 1} OR (rp.tenant_id IS NULL AND rd.tenant_id = $${params.length + 1}))`;
                params.push(tenantId);
            }

            const patientResult = await pool.query(patientQuery, params);
            referral_patients = parseInt(patientResult.rows[0].count);
        } catch (e) { console.error('Error fetching patients count:', e); }

        // 3. Referral Agents (Self)
        try {
            // Agents don't have SPOC, only Created By
            let agentQuery = `SELECT COUNT(*) FROM referral_agents WHERE status != 'Deleted' AND created_by = $1`;
            const params = [username || userIdStr]; // created_by is typically username strings in this system based on other controllers

            // Double check strict created_by logic. 
            // In referralAgentController, created_by uses req.user.username OR user_id.toString(). 
            // So we check against both to be safe or just passed one if consistent.
            // Let's use the OR logic for robust matching.
            agentQuery = `SELECT COUNT(*) FROM referral_agents WHERE status != 'Deleted' AND (created_by = $1 OR created_by = $2)`;
            params.push(userIdStr);

            if (tenantId) {
                agentQuery += ` AND tenant_id = $${params.length + 1}`;
                params.push(tenantId);
            }

            const agentResult = await pool.query(agentQuery, params);
            referral_agents = parseInt(agentResult.rows[0].count);
        } catch (e) { console.error('Error fetching agents count:', e); }

        // 4. Doctor Distribution (Self)
        try {
            let distQuery = `
                SELECT referral_means, COUNT(*) as count 
                FROM referral_doctor_module 
                WHERE status != 'Deleted'
                AND (marketing_spoc = $1 OR created_by = $2)
            `;
            const params = [userIdStr, username || ''];

            if (tenantId) {
                distQuery += ` AND tenant_id = $${params.length + 1}`;
                params.push(tenantId);
            }

            distQuery += ` GROUP BY referral_means`;

            const result = await pool.query(distQuery, params);
            referral_doctor_distribution = result.rows;
        } catch (e) { console.error('Error fetching doctor distribution:', e); }

        // 5. Patient Distribution (Self)
        try {
            let distQuery = `
                SELECT rp.referral_means, COUNT(*) as count 
                FROM referral_patients rp
                LEFT JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
                WHERE (rp.marketing_spoc = $1 OR rp.created_by = $2)
            `;
            const params = [userIdStr, username || ''];

            if (tenantId) {
                distQuery += ` AND (rp.tenant_id = $${params.length + 1} OR (rp.tenant_id IS NULL AND rd.tenant_id = $${params.length + 1}))`;
                params.push(tenantId);
            }

            distQuery += ` GROUP BY rp.referral_means`;

            const result = await pool.query(distQuery, params);
            referral_patient_distribution = result.rows;
        } catch (e) { console.error('Error fetching patient distribution:', e); }

        // 6. Referral Doctor Status Distribution (Self)
        // Groups by status: Initialization, Pending, Active
        let referral_doctor_status_distribution = [];
        try {
            let statusQuery = `
                SELECT status, COUNT(*) as count 
                FROM referral_doctor_module 
                WHERE status != 'Deleted'
                AND (marketing_spoc = $1 OR created_by = $2)
            `;
            const params = [userIdStr, username || ''];

            if (tenantId) {
                statusQuery += ` AND tenant_id = $${params.length + 1}`;
                params.push(tenantId);
            }

            statusQuery += ` GROUP BY status`;

            const result = await pool.query(statusQuery, params);
            referral_doctor_status_distribution = result.rows;
        } catch (e) { console.error('Error fetching doctor status distribution:', e); }

        // 7. Added This Month Counts (Self)
        let added_this_month = {
            doctors: 0,
            patients: 0,
            agents: 0
        };

        try {
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            // Doctors This Month
            let docMonthQuery = `
                SELECT COUNT(*) FROM referral_doctor_module 
                WHERE status != 'Deleted'
                AND (marketing_spoc = $1 OR created_by = $2)
                AND created_at >= $3
            `;
            let docParams = [userIdStr, username || '', startOfMonth];
            if (tenantId) {
                docMonthQuery += ` AND tenant_id = $4`;
                docParams.push(tenantId);
            }
            const docRes = await pool.query(docMonthQuery, docParams);
            added_this_month.doctors = parseInt(docRes.rows[0].count);

            // Patients This Month
            let patMonthQuery = `
                SELECT COUNT(*) FROM referral_patients rp
                LEFT JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
                WHERE (rp.marketing_spoc = $1 OR rp.created_by = $2)
                AND rp.created_at >= $3
            `;
            let patParams = [userIdStr, username || '', startOfMonth];
            if (tenantId) {
                patMonthQuery += ` AND (rp.tenant_id = $4 OR (rp.tenant_id IS NULL AND rd.tenant_id = $4))`;
                patParams.push(tenantId);
            }
            const patRes = await pool.query(patMonthQuery, patParams);
            added_this_month.patients = parseInt(patRes.rows[0].count);

            // Agents This Month
            let agentMonthQuery = `
                SELECT COUNT(*) FROM referral_agents 
                WHERE status != 'Deleted' 
                AND (created_by = $1 OR created_by = $2)
                AND created_at >= $3
            `;
            let agentParams = [userIdStr, username || '', startOfMonth];
            if (tenantId) {
                agentMonthQuery += ` AND tenant_id = $4`;
                agentParams.push(tenantId);
            }
            const agentRes = await pool.query(agentMonthQuery, agentParams);
            added_this_month.agents = parseInt(agentRes.rows[0].count);

        } catch (e) { console.error('Error fetching monthly counts:', e); }


        // --- Team Stats (Only for Managers) ---
        // These stats must reflect the BROADER SCOPE (Full Branch/Hospital)
        let teamStats = null;
        if (roleCode === 'MRKT_MNGR') {
            try {
                // Get manager's branch
                const manager = await User.findWithRole(userId);

                if (manager && manager.branch_id) {
                    const branchId = manager.branch_id;
                    const teamSizeQuery = `
                        SELECT COUNT(DISTINCT u.user_id) 
                        FROM users u
                        JOIN staff s ON u.user_id = s.user_id
                        JOIN staff_branches sb ON s.staff_id = sb.staff_id
                        JOIN roles r ON u.role_id = r.role_id
                        WHERE sb.branch_id = $1 
                        AND (r.role_code = 'MRKT_EXEC' OR r.role_code = 'MRKT_MNGR')
                        AND u.is_active = true
                    `;
                    const teamSizeResult = await pool.query(teamSizeQuery, [branchId]);
                    const teamSize = parseInt(teamSizeResult.rows[0].count);

                    // For Team Totals, we should query based on the TENANT/BRANCH scope, 
                    // NOT just by summing up team member IDs. This ensures we catch everything in the branch's view.

                    const branchIds = await getAssignedBranchIds(req.user); // Should be [branchId]

                    // Team Doctors (Total in Branch/Tenant)
                    let teamDocQuery = `SELECT COUNT(*) FROM referral_doctor_module WHERE status != 'Deleted'`;
                    let teamParams = [];
                    if (tenantId) {
                        teamDocQuery += ` AND tenant_id = $${teamParams.length + 1}`;
                        teamParams.push(tenantId);
                    }
                    if (branchIds.length > 0) {
                        teamDocQuery += ` AND (branch_id = ANY($${teamParams.length + 1}) OR created_by = $${teamParams.length + 2})`;
                        teamParams.push(branchIds);
                        teamParams.push(username || userIdStr); // Fallback to ensure manager's own creations are definitely included if not in branch? 
                        // Actually, if we want "Total Team", we really just want everything VISIBLE to the manager.
                        // So we re-use the "Manager's View" logic from before for the "Team Total".
                    }
                    const teamDocRes = await pool.query(teamDocQuery, teamParams);

                    // Team Patients (Total in Tenant)
                    let teamPatQuery = `
                        SELECT COUNT(*) FROM referral_patients rp
                        LEFT JOIN referral_doctor_module rd ON rp.referral_doctor_id = rd.id
                        WHERE 1=1
                    `;
                    let teamPatParams = [];
                    if (tenantId) {
                        teamPatQuery += ` AND (rp.tenant_id = $${teamPatParams.length + 1} OR (rp.tenant_id IS NULL AND rd.tenant_id = $${teamPatParams.length + 1}))`;
                        teamPatParams.push(tenantId);
                    }
                    const teamPatRes = await pool.query(teamPatQuery, teamPatParams);

                    // Team Agents (Total in Tenant)
                    let teamAgentQuery = `SELECT COUNT(*) FROM referral_agents WHERE status != 'Deleted'`;
                    let teamAgentParams = [];
                    if (tenantId) {
                        teamAgentQuery += ` AND tenant_id = $${teamAgentParams.length + 1}`;
                        teamAgentParams.push(tenantId);
                    }
                    const teamAgentRes = await pool.query(teamAgentQuery, teamAgentParams);

                    teamStats = {
                        team_members: teamSize,
                        total_doctors: parseInt(teamDocRes.rows[0].count),
                        total_patients: parseInt(teamPatRes.rows[0].count),
                        total_agents: parseInt(teamAgentRes.rows[0].count)
                    };
                }
            } catch (e) {
                console.error('Error calculating team stats:', e);
            }
        }

        res.status(200).json({
            success: true,
            data: {
                referral_doctors,
                referral_patients,
                referral_agents,
                referral_doctor_distribution,
                referral_patient_distribution,
                referral_doctor_status_distribution,
                added_this_month,
                team_stats: teamStats // Add team stats to response
            }
        });

    } catch (error) {
        console.error('Error fetching marketing dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
