const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class AdminController {
    /**
     * Get dashboard stats for Super Admin
     * GET /api/admin/stats
     */
    static async getDashboardStats(req, res, next) {
        try {
            // 1. Total Hospitals
            const hospitalsRes = await query('SELECT COUNT(*) FROM hospitals');

            // 2. Total Doctors (Global)
            const doctorsRes = await query('SELECT COUNT(*) FROM doctors');

            // 3. Total Nurses (Global)
            const nursesRes = await query('SELECT COUNT(*) FROM nurses');

            // 4. Total Receptionists (Global)
            const receptionistsRes = await query("SELECT COUNT(*) FROM staff WHERE staff_type = 'RECEPTIONIST'");

            // 5. Total Client Admins (Global)
            // Client Admins are staff with role CLIENT_ADMIN? Or in client_admins table?
            // Let's check if client_admins table exists. Based on ClientAdmin model, it likely does or uses a view.
            // But for now let's stick to the 4 requested stats in the dashboard + maybe Client Admins count if useful.
            // The dashboard shows: Hospitals, Doctors, Nurses, Receptionists.

            res.status(200).json({
                status: 'success',
                data: {
                    stats: {
                        hospitals: parseInt(hospitalsRes.rows[0].count),
                        doctors: parseInt(doctorsRes.rows[0].count),
                        nurses: parseInt(nursesRes.rows[0].count),
                        receptionists: parseInt(receptionistsRes.rows[0].count)
                    }
                }
            });
        } catch (error) {
            console.error('Get admin dashboard stats error:', error);
            next(new AppError('Failed to fetch admin dashboard stats', 500));
        }
    }
}

module.exports = AdminController;
