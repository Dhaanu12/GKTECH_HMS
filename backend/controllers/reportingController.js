const { AppError } = require('../middleware/errorHandler');

class ReportingController {
    /**
     * Get performance metrics for all branches in a hospital
     */
    static async getBranchPerformance(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            const hospital_id = req.user.hospital_id;
            const { startDate, endDate } = req.query;

            const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString(); // Default to start of year
            const end = endDate || new Date().toISOString();

            // 1. Revenue & Footfall by Branch
            const branchStatsQuery = `
                SELECT 
                    b.branch_id,
                    b.branch_name,
                    COUNT(o.opd_id) as total_appointments,
                    SUM(COALESCE(o.consultation_fee, 0)) as total_revenue,
                    COUNT(DISTINCT o.patient_id) as unique_patients
                FROM branches b
                LEFT JOIN opd_entries o ON b.branch_id = o.branch_id 
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                WHERE b.hospital_id = $1
                GROUP BY b.branch_id, b.branch_name
                ORDER BY total_revenue DESC
            `;

            const stats = await client.query(branchStatsQuery, [hospital_id, start, end]);

            res.status(200).json({
                status: 'success',
                data: stats.rows
            });
        } catch (error) {
            console.error('Branch reporting error:', error);
            next(new AppError('Failed to fetch branch reports', 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get detailed stats for Doctors, Nurses, Receptionists
     */
    static async getStaffPerformance(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            const hospital_id = req.user.hospital_id;
            const { type, startDate, endDate } = req.query; // type: 'DOCTOR', 'NURSE', 'RECEPTIONIST'
            const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString();
            const end = endDate || new Date().toISOString();

            let query = '';

            if (type === 'DOCTOR') {
                query = `
                    SELECT 
                        d.doctor_id as id,
                        d.first_name,
                        d.last_name,
                        d.specialization as role_detail,
                        COUNT(o.opd_id) as task_count, -- Patients Seen
                        SUM(COALESCE(o.consultation_fee, 0)) as performance_metric, -- Revenue
                        -- New Metrics
                        COUNT(CASE WHEN o.visit_type = 'Walk-in' THEN 1 END) as walk_in_count,
                        COUNT(CASE WHEN o.visit_type = 'Referral' THEN 1 END) as referral_count,
                        COUNT(CASE WHEN o.visit_type = 'Follow-up' THEN 1 END) as follow_up_count,
                        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.doctor_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as total_appointments,
                        (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.doctor_id AND a.appointment_status = 'Completed' AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as completed_appointments
                    FROM doctors d
                    JOIN doctor_branches db ON d.doctor_id = db.doctor_id
                    JOIN branches b ON db.branch_id = b.branch_id
                    LEFT JOIN opd_entries o ON d.doctor_id = o.doctor_id 
                        AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    WHERE b.hospital_id = $1
                    GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
                `;
            } else if (type === 'NURSE') {
                query = `
                    SELECT 
                        n.nurse_id as id,
                        n.first_name,
                        n.last_name,
                        'Nurse' as role_detail,
                        COUNT(ns.nurse_shift_id) as task_count, -- Shifts Completed
                        COUNT(CASE WHEN ns.attendance_status = 'Present' THEN 1 END) as performance_metric, -- Present Days
                        -- New Punctuality Metrics
                        COUNT(CASE WHEN ns.attendance_status = 'Late' THEN 1 END) as late_days,
                        COUNT(CASE WHEN ns.attendance_status = 'Absent' THEN 1 END) as absent_days
                    FROM nurses n
                    JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
                    JOIN branches b ON nb.branch_id = b.branch_id
                    LEFT JOIN nurse_shifts ns ON n.nurse_id = ns.nurse_id 
                        AND ns.shift_date >= $2::date AND ns.shift_date <= $3::date
                    WHERE b.hospital_id = $1
                    GROUP BY n.nurse_id, n.first_name, n.last_name
                `;
            } else if (type === 'RECEPTIONIST') {
                query = `
                    SELECT 
                        s.staff_id as id,
                        s.first_name,
                        s.last_name,
                        'Receptionist' as role_detail,
                        -- Total Actions (Bookings + Checkins)
                        (
                            (SELECT COUNT(*) FROM appointments a 
                             WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                             AND a.confirmed_by = s.user_id)
                            +
                            (SELECT COUNT(*) FROM opd_entries o 
                             WHERE o.visit_date >= $2::date AND o.visit_date <= $3::date 
                             AND o.checked_in_by IS NOT NULL 
                             AND o.checked_in_by ~ '^[0-9]+$'
                             AND o.checked_in_by::INTEGER = s.user_id)
                        ) as task_count,
                        -- Primary Performance Metric (Cancellations + No-shows handled/recorded)
                        (SELECT COUNT(*) FROM appointments a 
                         WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                         AND (a.cancelled_by = s.user_id OR (a.confirmed_by = s.user_id AND a.appointment_status = 'No-show'))) as performance_metric,
                         
                         -- Detailed Breakdown
                         (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as total_confirmed,
                         (SELECT COUNT(*) FROM opd_entries o WHERE o.checked_in_by IS NOT NULL AND o.checked_in_by ~ '^[0-9]+$' AND o.checked_in_by::INTEGER = s.user_id AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as opd_checkins,
                         (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_status = 'No-show' AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as no_show_count,
                         (SELECT COUNT(*) FROM appointments a WHERE a.cancelled_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as cancellations_handled
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE b.hospital_id = $1 AND s.staff_type = 'RECEPTIONIST'
                    GROUP BY s.staff_id, s.first_name, s.last_name, s.user_id
                `;
            } else {
                return next(new AppError('Invalid staff type', 400));
            }

            const results = await client.query(query, [hospital_id, start, end]);

            res.status(200).json({
                status: 'success',
                data: results.rows
            });

        } catch (error) {
            console.error('Staff reporting error:', error);
            next(new AppError('Failed to fetch staff reports', 500));
        } finally {
            client.release();
        }
    }
}

module.exports = ReportingController;
