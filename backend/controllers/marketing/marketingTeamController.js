const { Pool } = require('pg');
require('dotenv').config();
const User = require('../../models/User');

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'hms_database',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD,
});

// Get all marketing executives in the same branch as the logged-in manager
exports.getTeamExecutives = async (req, res) => {
    try {
        const userId = req.user.user_id;
        const userRole = req.user.role_code;

        // Verify user is a marketing manager
        if (userRole !== 'MRKT_MNGR') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only marketing managers can view team.'
            });
        }

        // Get manager's branch using User model (which handles joins)
        console.log('[Team Executives] Fetching branch for manager:', userId);
        const manager = await User.findWithRole(userId);

        if (!manager) {
            return res.status(404).json({
                success: false,
                message: 'Manager not found'
            });
        }

        const branchId = manager.branch_id;
        console.log('[Team Executives] Manager branch_id:', branchId);

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: 'Manager has no assigned branch'
            });
        }

        // Fetch all marketing executives in the same branch
        // Marketing executives are staff, so we join with staff and staff_branches
        console.log('[Team Executives] Querying for executives in branch:', branchId);
        const executivesQuery = await pool.query(
            `SELECT 
                u.user_id,
                s.first_name,
                s.last_name,
                u.username,
                u.email,
                u.phone_number,
                u.created_at,
                u.is_active as status,
                r.role_code,
                b.branch_name,
                h.hospital_name
            FROM users u
            JOIN roles r ON u.role_id = r.role_id
            JOIN staff s ON u.user_id = s.user_id
            JOIN staff_branches sb ON s.staff_id = sb.staff_id
            JOIN branches b ON sb.branch_id = b.branch_id
            JOIN hospitals h ON b.hospital_id = h.hospital_id
            WHERE sb.branch_id = $1 
                AND r.role_code = 'MRKT_EXEC'
                AND u.is_active = true
            ORDER BY s.first_name, s.last_name`,
            [branchId]
        );

        console.log('[Team Executives] Found executives:', executivesQuery.rows.length);

        res.json({
            success: true,
            data: executivesQuery.rows
        });

    } catch (error) {
        console.error('Error fetching team executives:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team executives',
            error: error.message
        });
    }
};

// Get performance stats for a specific executive
exports.getExecutiveStats = async (req, res) => {
    try {
        const { executive_id } = req.params;
        const userId = req.user.user_id;
        const userRole = req.user.role_code;
        const tenantId = req.user.hospital_id || req.user.tenant_id;

        // Verify user is a marketing manager
        if (userRole !== 'MRKT_MNGR') {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get manager details
        const manager = await User.findWithRole(userId);
        if (!manager || !manager.branch_id) {
            return res.status(404).json({ success: false, message: 'Manager or branch not found' });
        }

        // Get executive details
        const executive = await User.findWithRole(executive_id);
        if (!executive) {
            return res.status(404).json({ success: false, message: 'Executive not found' });
        }

        // Check if executive is MRKT_EXEC
        if (executive.role_code !== 'MRKT_EXEC') {
            return res.status(400).json({ success: false, message: 'User is not a marketing executive' });
        }

        // Verify branch match
        if (manager.branch_id !== executive.branch_id) {
            return res.status(403).json({
                success: false,
                message: 'Cannot view stats for executives in other branches'
            });
        }

        // Get stats for the executive
        const executiveIdStr = executive_id.toString();
        const executiveUsername = executive.username;

        // Helper params for queries
        const spocParams = [executiveIdStr, executiveUsername];
        let tenantClause = '';
        if (tenantId) {
            spocParams.push(tenantId);
            tenantClause = `AND tenant_id = $3`;
        }

        // Total doctors added (SPOC or Created By)
        const doctorsQuery = await pool.query(
            `SELECT COUNT(*) as total_doctors
            FROM referral_doctor_module
            WHERE (marketing_spoc = $1 OR created_by = $2) 
            AND status != 'Deleted' ${tenantClause}`,
            spocParams
        );

        // Total patients referred (SPOC or Created By)
        const patientsQuery = await pool.query(
            `SELECT COUNT(*) as total_patients
            FROM referral_patients
            WHERE (marketing_spoc = $1 OR created_by = $2) ${tenantClause}`,
            spocParams
        );

        // Recent doctors (last 30 days)
        const recentDoctorsQuery = await pool.query(
            `SELECT COUNT(*) as recent_doctors
            FROM referral_doctor_module
            WHERE (marketing_spoc = $1 OR created_by = $2)
                AND status != 'Deleted'
                AND created_at >= NOW() - INTERVAL '30 days' ${tenantClause}`,
            spocParams
        );

        // Recent patients (last 30 days)
        const recentPatientsQuery = await pool.query(
            `SELECT COUNT(*) as recent_patients
            FROM referral_patients
            WHERE (marketing_spoc = $1 OR created_by = $2)
                AND created_at >= NOW() - INTERVAL '30 days' ${tenantClause}`,
            spocParams
        );

        // Active doctors (doctors with Active status)
        const activeDoctorsQuery = await pool.query(
            `SELECT COUNT(DISTINCT id) as active_doctors
            FROM referral_doctor_module
            WHERE (marketing_spoc = $1 OR created_by = $2)
                AND status = 'Active' ${tenantClause}`,
            spocParams
        );

        res.json({
            success: true,
            data: {
                total_doctors: parseInt(doctorsQuery.rows[0].total_doctors),
                total_patients: parseInt(patientsQuery.rows[0].total_patients),
                recent_doctors: parseInt(recentDoctorsQuery.rows[0].recent_doctors),
                recent_patients: parseInt(recentPatientsQuery.rows[0].recent_patients),
                active_doctors: parseInt(activeDoctorsQuery.rows[0].active_doctors)
            }
        });

    } catch (error) {
        console.error('Error fetching executive stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch executive stats',
            error: error.message
        });
    }
};
