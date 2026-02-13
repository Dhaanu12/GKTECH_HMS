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

exports.getDashboardStats = async (req, res) => {
    try {
        console.log('Dashboard Stats Request - User:', req.user);

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        const userId = req.user.user_id || req.user.userId || req.user.id;
        const roleCode = req.user.role_code; // Get role info
        const username = req.user.username;

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID missing in token' });
        }

        const userIdStr = userId.toString();

        // --- Individual Stats ---
        let referral_doctors = 0;
        let referral_patients = 0;
        let referral_agents = 0;
        let referral_doctor_distribution = [];
        let referral_patient_distribution = [];

        // 1. Referral Doctors
        try {
            const doctorQuery = `SELECT COUNT(*) FROM referral_doctor_module WHERE marketing_spoc = $1 AND status != 'Deleted'`;
            const doctorResult = await pool.query(doctorQuery, [userIdStr]);
            referral_doctors = parseInt(doctorResult.rows[0].count);
        } catch (e) { console.error('Error fetching doctors count:', e); }

        // 2. Referral Patients
        try {
            const patientQuery = `SELECT COUNT(*) FROM referral_patients WHERE marketing_spoc = $1 OR marketing_spoc = $2`;
            const patientResult = await pool.query(patientQuery, [userIdStr, username || '']);
            referral_patients = parseInt(patientResult.rows[0].count);
        } catch (e) { console.error('Error fetching patients count:', e); }

        // 3. Referral Agents
        try {
            const agentQuery = `SELECT COUNT(*) FROM referral_agents WHERE (created_by = $1 OR created_by = $2) AND status != 'Deleted'`;
            const agentResult = await pool.query(agentQuery, [userIdStr, username || '']);
            referral_agents = parseInt(agentResult.rows[0].count);
        } catch (e) { console.error('Error fetching agents count:', e); }

        // 4. Doctor Distribution
        try {
            const distQuery = `SELECT referral_means, COUNT(*) as count FROM referral_doctor_module WHERE marketing_spoc = $1 AND status != 'Deleted' GROUP BY referral_means`;
            const result = await pool.query(distQuery, [userIdStr]);
            referral_doctor_distribution = result.rows;
        } catch (e) { console.error('Error fetching doctor distribution:', e); }

        // 5. Patient Distribution
        try {
            const distQuery = `SELECT referral_means, COUNT(*) as count FROM referral_patients WHERE marketing_spoc = $1 OR marketing_spoc = $2 GROUP BY referral_means`;
            const result = await pool.query(distQuery, [userIdStr, username || '']);
            referral_patient_distribution = result.rows;
        } catch (e) { console.error('Error fetching patient distribution:', e); }


        // --- Team Stats (Only for Managers) ---
        let teamStats = null;
        if (roleCode === 'MRKT_MNGR') {
            try {
                // Get manager's branch
                const manager = await User.findWithRole(userId);

                if (manager && manager.branch_id) {
                    const branchId = manager.branch_id;

                    // Get all team members (Executives + Manager) in the branch
                    // Note: We include the manager themselves in the "Total"
                    const teamQuery = `
                        SELECT u.user_id, u.username
                        FROM users u
                        JOIN staff s ON u.user_id = s.user_id
                        JOIN staff_branches sb ON s.staff_id = sb.staff_id
                        JOIN roles r ON u.role_id = r.role_id
                        WHERE sb.branch_id = $1 
                        AND (r.role_code = 'MRKT_EXEC' OR r.role_code = 'MRKT_MNGR')
                        AND u.is_active = true
                    `;
                    const teamResult = await pool.query(teamQuery, [branchId]);

                    const teamUserIds = teamResult.rows.map(row => row.user_id.toString());
                    const teamUsernames = teamResult.rows.map(row => row.username).filter(u => u); // Filter out null/undefined

                    // Combine IDs and Usernames for queries that need both
                    const allIdentifiers = [...teamUserIds, ...teamUsernames];
                    const teamSize = teamUserIds.length;

                    console.log(`[Dashboard] Manager ${userId} has ${teamSize} team members in branch ${branchId}`);

                    if (teamUserIds.length > 0) {
                        // Helper to generate $1, $2, ... placeholders
                        const generatePlaceholders = (len) => Array.from({ length: len }, (_, i) => `$${i + 1}`).join(',');

                        const idsParam = generatePlaceholders(teamUserIds.length);
                        const allIdentifiersParam = generatePlaceholders(allIdentifiers.length);

                        // Team Doctors (Usually linked by ID only based on individual query, but keeping consistent with individual query)
                        // Individual query: WHERE marketing_spoc = $1 (ID only)
                        const teamDocRes = await pool.query(
                            `SELECT COUNT(*) FROM referral_doctor_module WHERE marketing_spoc IN (${idsParam}) AND status != 'Deleted'`,
                            teamUserIds
                        );

                        // Team Patients (Individual query checks ID OR Username)
                        const teamPatRes = await pool.query(
                            `SELECT COUNT(*) FROM referral_patients WHERE marketing_spoc IN (${allIdentifiersParam})`,
                            allIdentifiers
                        );

                        // Team Agents (Individual query checks ID OR Username)
                        const teamAgentRes = await pool.query(
                            `SELECT COUNT(*) FROM referral_agents WHERE created_by IN (${allIdentifiersParam}) AND status != 'Deleted'`,
                            allIdentifiers
                        );

                        teamStats = {
                            team_members: teamSize,
                            total_doctors: parseInt(teamDocRes.rows[0].count),
                            total_patients: parseInt(teamPatRes.rows[0].count),
                            total_agents: parseInt(teamAgentRes.rows[0].count)
                        };
                    }
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
                team_stats: teamStats // Add team stats to response
            }
        });

    } catch (error) {
        console.error('Error fetching marketing dashboard stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};
