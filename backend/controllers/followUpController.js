/**
 * Follow-up Controller
 * Handles retrieval of patient follow-up data from consultation_outcomes
 */

const { query } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

class FollowUpController {
    /**
     * Get patients with due/overdue follow-ups
     * GET /api/follow-ups/due?range=today|week|overdue|all&doctor_id=optional
     */
    static async getDueFollowUps(req, res, next) {
        try {
            const { range = 'all', doctor_id } = req.query;
            const userRole = req.user.role_code;
            const userDoctorId = req.user.doctor_id;

            // Build date filter based on range
            let dateFilter = '';
            switch (range) {
                case 'overdue':
                    dateFilter = 'AND co.next_visit_date < CURRENT_DATE';
                    break;
                case 'today':
                    dateFilter = 'AND co.next_visit_date = CURRENT_DATE';
                    break;
                case 'week':
                    dateFilter = "AND co.next_visit_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'";
                    break;
                default:
                    dateFilter = "AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days'";
            }

            // Determine doctor filter and params
            let doctorFilter = '';
            let branchFilter = '';
            let params = [];
            let paramIndex = 1;

            // Branch filter for receptionists (filter by their branch)
            const branch_id = req.user.branch_id;
            if (branch_id && userRole !== 'DOCTOR') {
                branchFilter = `AND oe.branch_id = $${paramIndex}`;
                params.push(branch_id);
                paramIndex++;
            }

            // Doctor only sees their own follow-ups
            if (userRole === 'DOCTOR' && userDoctorId) {
                doctorFilter = `AND co.doctor_id = $${paramIndex}`;
                params.push(userDoctorId);
                paramIndex++;
            } else if (doctor_id) {
                doctorFilter = `AND co.doctor_id = $${paramIndex}`;
                params.push(parseInt(doctor_id));
                paramIndex++;
            }

            const result = await query(`
                SELECT 
                    co.outcome_id,
                    co.patient_id,
                    co.doctor_id,
                    co.next_visit_date,
                    co.next_visit_status,
                    co.diagnosis,
                    co.created_at as consultation_date,
                    p.first_name as patient_first_name,
                    p.last_name as patient_last_name,
                    p.contact_number as phone,
                    p.patient_code,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name,
                    d.specialization,
                    CASE 
                        WHEN co.next_visit_date < CURRENT_DATE THEN 'overdue'
                        WHEN co.next_visit_date = CURRENT_DATE THEN 'due_today'
                        ELSE 'upcoming'
                    END as follow_up_status,
                    CASE 
                        WHEN co.next_visit_date < CURRENT_DATE THEN CURRENT_DATE - co.next_visit_date
                        ELSE 0
                    END as days_overdue,
                    CASE 
                        WHEN co.next_visit_date > CURRENT_DATE THEN co.next_visit_date - CURRENT_DATE
                        ELSE 0
                    END as days_until_due
                FROM consultation_outcomes co
                JOIN opd_entries oe ON co.opd_id = oe.opd_id
                JOIN patients p ON co.patient_id = p.patient_id
                JOIN doctors d ON co.doctor_id = d.doctor_id
                WHERE co.next_visit_date IS NOT NULL
                    AND co.consultation_status = 'Completed'
                    ${dateFilter}
                    ${branchFilter}
                    ${doctorFilter}
                    AND NOT EXISTS (
                        SELECT 1 FROM opd_entries o 
                        WHERE o.patient_id = co.patient_id 
                        AND o.doctor_id = co.doctor_id
                        AND o.visit_date > co.created_at::date
                        AND o.visit_status = 'Completed'
                    )
                ORDER BY 
                    CASE WHEN co.next_visit_date < CURRENT_DATE THEN 0 ELSE 1 END,
                    co.next_visit_date ASC
                LIMIT 50
            `, params);

            // Group results by status
            const overdue = result.rows.filter(r => r.follow_up_status === 'overdue');
            const dueToday = result.rows.filter(r => r.follow_up_status === 'due_today');
            const upcoming = result.rows.filter(r => r.follow_up_status === 'upcoming');

            res.status(200).json({
                status: 'success',
                data: {
                    overdue,
                    due_today: dueToday,
                    upcoming,
                    summary: {
                        overdue_count: overdue.length,
                        due_today_count: dueToday.length,
                        upcoming_count: upcoming.length,
                        total: result.rows.length
                    }
                }
            });
        } catch (error) {
            console.error('Get due follow-ups error:', error);
            next(new AppError('Failed to fetch follow-up data', 500));
        }
    }

    /**
     * Get follow-up status for a specific patient
     * GET /api/follow-ups/patient/:patientId
     */
    static async getPatientFollowUpStatus(req, res, next) {
        try {
            const { patientId } = req.params;

            const result = await query(`
                SELECT 
                    co.outcome_id,
                    co.next_visit_date,
                    co.next_visit_status,
                    co.diagnosis,
                    co.doctor_id,
                    d.first_name as doctor_first_name,
                    d.last_name as doctor_last_name,
                    CASE 
                        WHEN co.next_visit_date < CURRENT_DATE THEN 'overdue'
                        WHEN co.next_visit_date = CURRENT_DATE THEN 'due_today'
                        WHEN co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'upcoming'
                        ELSE 'scheduled'
                    END as follow_up_status,
                    CASE 
                        WHEN co.next_visit_date < CURRENT_DATE THEN CURRENT_DATE - co.next_visit_date
                        ELSE 0
                    END as days_overdue
                FROM consultation_outcomes co
                JOIN doctors d ON co.doctor_id = d.doctor_id
                WHERE co.patient_id = $1
                    AND co.next_visit_date IS NOT NULL
                    AND co.consultation_status = 'Completed'
                    AND NOT EXISTS (
                        SELECT 1 FROM opd_entries o 
                        WHERE o.patient_id = co.patient_id 
                        AND o.doctor_id = co.doctor_id
                        AND o.visit_date > co.created_at::date
                        AND o.visit_status = 'Completed'
                    )
                ORDER BY co.next_visit_date ASC
                LIMIT 1
            `, [patientId]);

            res.status(200).json({
                status: 'success',
                data: {
                    has_pending_followup: result.rows.length > 0,
                    followup: result.rows[0] || null
                }
            });
        } catch (error) {
            console.error('Get patient follow-up status error:', error);
            next(new AppError('Failed to fetch patient follow-up status', 500));
        }
    }

    /**
     * Get follow-up statistics for dashboard
     * GET /api/follow-ups/stats
     */
    static async getFollowUpStats(req, res, next) {
        try {
            const userRole = req.user.role_code;
            const userDoctorId = req.user.doctor_id;

            // Build query based on role
            let sql;
            let params = [];

            if (userRole === 'DOCTOR' && userDoctorId) {
                // Doctor sees only their own follow-ups
                sql = `
                    SELECT 
                        COALESCE(SUM(CASE WHEN co.next_visit_date < CURRENT_DATE THEN 1 ELSE 0 END), 0) as overdue_count,
                        COALESCE(SUM(CASE WHEN co.next_visit_date = CURRENT_DATE THEN 1 ELSE 0 END), 0) as due_today_count,
                        COALESCE(SUM(CASE WHEN co.next_visit_date > CURRENT_DATE AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as upcoming_week_count
                    FROM consultation_outcomes co
                    WHERE co.next_visit_date IS NOT NULL
                        AND co.consultation_status = 'Completed'
                        AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days'
                        AND co.doctor_id = $1
                        AND NOT EXISTS (
                            SELECT 1 FROM opd_entries o 
                            WHERE o.patient_id = co.patient_id 
                            AND o.doctor_id = co.doctor_id
                            AND o.visit_date > co.created_at::date
                            AND o.visit_status = 'Completed'
                        )
                `;
                params = [userDoctorId];
            } else {
                // Other roles see follow-ups filtered by their branch
                const branch_id = req.user.branch_id;
                if (branch_id) {
                    sql = `
                        SELECT 
                            COALESCE(SUM(CASE WHEN co.next_visit_date < CURRENT_DATE THEN 1 ELSE 0 END), 0) as overdue_count,
                            COALESCE(SUM(CASE WHEN co.next_visit_date = CURRENT_DATE THEN 1 ELSE 0 END), 0) as due_today_count,
                            COALESCE(SUM(CASE WHEN co.next_visit_date > CURRENT_DATE AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as upcoming_week_count
                        FROM consultation_outcomes co
                        JOIN opd_entries oe ON co.opd_id = oe.opd_id
                        WHERE co.next_visit_date IS NOT NULL
                            AND co.consultation_status = 'Completed'
                            AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days'
                            AND oe.branch_id = $1
                            AND NOT EXISTS (
                                SELECT 1 FROM opd_entries o 
                                WHERE o.patient_id = co.patient_id 
                                AND o.doctor_id = co.doctor_id
                                AND o.visit_date > co.created_at::date
                                AND o.visit_status = 'Completed'
                            )
                    `;
                    params = [branch_id];
                } else {
                    // Fallback if no branch (shouldn't happen for receptionists)
                    sql = `
                        SELECT 
                            COALESCE(SUM(CASE WHEN co.next_visit_date < CURRENT_DATE THEN 1 ELSE 0 END), 0) as overdue_count,
                            COALESCE(SUM(CASE WHEN co.next_visit_date = CURRENT_DATE THEN 1 ELSE 0 END), 0) as due_today_count,
                            COALESCE(SUM(CASE WHEN co.next_visit_date > CURRENT_DATE AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days' THEN 1 ELSE 0 END), 0) as upcoming_week_count
                        FROM consultation_outcomes co
                        WHERE co.next_visit_date IS NOT NULL
                            AND co.consultation_status = 'Completed'
                            AND co.next_visit_date <= CURRENT_DATE + INTERVAL '7 days'
                            AND NOT EXISTS (
                                SELECT 1 FROM opd_entries o 
                                WHERE o.patient_id = co.patient_id 
                                AND o.doctor_id = co.doctor_id
                                AND o.visit_date > co.created_at::date
                                AND o.visit_status = 'Completed'
                            )
                    `;
                }
            }

            const result = await query(sql, params);

            res.status(200).json({
                status: 'success',
                data: result.rows[0] || {
                    overdue_count: 0,
                    due_today_count: 0,
                    upcoming_week_count: 0
                }
            });
        } catch (error) {
            console.error('Get follow-up stats error:', error);
            next(new AppError('Failed to fetch follow-up statistics', 500));
        }
    }
}

module.exports = FollowUpController;
