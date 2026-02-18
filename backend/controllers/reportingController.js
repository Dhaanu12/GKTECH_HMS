const { AppError } = require('../middleware/errorHandler');

class ReportingController {
    /**
     * Get performance metrics for all branches in a hospital
     */
    static async getBranchPerformance(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            const hospital_id = req.user.hospital_id;
            let { startDate, endDate } = req.query;

            // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
            const convertDateFormat = (dateStr) => {
                if (!dateStr) return null;
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                    const [day, month, year] = dateStr.split('-');
                    return `${year}-${month}-${day}`;
                }
                return dateStr;
            };

            if (startDate) startDate = convertDateFormat(startDate);
            if (endDate) endDate = convertDateFormat(endDate);

            const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            // 1. Revenue & Footfall by Branch with Lab Metrics
            const branchStatsQuery = `
                SELECT 
                    b.branch_id,
                    b.branch_name,
                    COUNT(o.opd_id) as total_appointments,
                    COUNT(DISTINCT o.patient_id) as unique_patients,
                    
                    -- Revenue Breakdown
                    (
                        SELECT COALESCE(SUM(d.final_price), 0)
                        FROM bill_details d
                        JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                        WHERE bm.branch_id = b.branch_id
                        AND d.service_type = 'consultation'
                        AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                    ) as consultation_revenue,
                    (
                        SELECT COALESCE(SUM(d.final_price), 0)
                        FROM bill_details d
                        JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                        WHERE bm.branch_id = b.branch_id
                        AND d.service_type = 'LAB'
                        AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                    ) as lab_revenue,
                    (
                        SELECT COALESCE(SUM(d.final_price), 0)
                        FROM bill_details d
                        JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                        WHERE bm.branch_id = b.branch_id
                        AND d.service_type = 'PHARMACY'
                        AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                    ) as pharmacy_revenue,
                    (
                        SELECT COALESCE(SUM(d.final_price), 0)
                        FROM bill_details d
                        JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                        WHERE bm.branch_id = b.branch_id
                        AND (d.service_type NOT IN ('LAB', 'PHARMACY', 'consultation') OR d.service_type IS NULL)
                        AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                    ) as other_revenue,
                    
                    -- Total Revenue (all sources from billing)
                    (
                        SELECT COALESCE(SUM(d.final_price), 0)
                        FROM bill_details d
                        JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                        WHERE bm.branch_id = b.branch_id
                        AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                    ) as total_revenue,
                    
                    -- Lab Processing Metrics
                    (
                        SELECT COUNT(*)
                        FROM lab_orders lo
                        WHERE lo.branch_id = b.branch_id
                        AND DATE(lo.ordered_at) >= $2::date AND DATE(lo.ordered_at) <= $3::date
                    ) as lab_orders_count,
                    (
                        SELECT COUNT(*)
                        FROM lab_orders lo
                        WHERE lo.branch_id = b.branch_id
                        AND lo.status = 'Completed'
                        AND DATE(lo.ordered_at) >= $2::date AND DATE(lo.ordered_at) <= $3::date
                    ) as lab_completed_count
                    
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
            let { type, startDate, endDate } = req.query; // type: 'DOCTOR', 'NURSE', 'RECEPTIONIST'

            // Helper function to convert DD-MM-YYYY to YYYY-MM-DD
            const convertDateFormat = (dateStr) => {
                if (!dateStr) return null;
                // Check if already in YYYY-MM-DD format
                if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
                // Convert DD-MM-YYYY to YYYY-MM-DD
                if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
                    const [day, month, year] = dateStr.split('-');
                    return `${year}-${month}-${day}`;
                }
                return dateStr;
            };

            // Convert date formats if provided
            console.log('BEFORE conversion:', { startDate, endDate });
            if (startDate) startDate = convertDateFormat(startDate);
            if (endDate) endDate = convertDateFormat(endDate);
            console.log('AFTER conversion:', { startDate, endDate });

            const start = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            console.log('Staff Performance Query - FINAL:', { type, start, end });

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
                        
                        -- Lab Tasks Completed (matching dashboard logic & frontend 'labs_completed')
                        (SELECT COUNT(*) 
                         FROM lab_orders lo 
                         WHERE lo.assigned_nurse_id = n.nurse_id 
                         AND lo.status = 'Completed'
                         AND lo.ordered_at::date >= $2::date 
                         AND lo.ordered_at::date <= $3::date) as labs_completed,

                        -- Lab Tasks Assigned (new metric for 'labs_assigned')
                        (SELECT COUNT(*) 
                         FROM lab_orders lo 
                         WHERE lo.assigned_nurse_id = n.nurse_id 
                         AND lo.ordered_at::date >= $2::date 
                         AND lo.ordered_at::date <= $3::date) as labs_assigned,
                        
                        -- Patients Vitals Handled (frontend 'patients_vitals_handled')
                        (SELECT COUNT(*) 
                         FROM opd_entries o 
                         WHERE o.vital_signs IS NOT NULL 
                         AND o.visit_date >= $2::date 
                         AND o.visit_date <= $3::date 
                         AND o.branch_id IN (SELECT branch_id FROM nurse_branches WHERE nurse_id = n.nurse_id)) as patients_vitals_handled,
                        
                        -- Pending Tasks (frontend 'labs_pending')
                        (SELECT COUNT(*) 
                         FROM lab_orders lo 
                         WHERE lo.assigned_nurse_id = n.nurse_id 
                         AND lo.status = 'In-Progress'
                         AND lo.ordered_at::date >= $2::date 
                         AND lo.ordered_at::date <= $3::date) as labs_pending,
                        
                        -- Urgent Count (extra)
                        (SELECT COUNT(*) 
                         FROM lab_orders lo 
                         WHERE lo.assigned_nurse_id = n.nurse_id 
                         AND (lo.priority = 'STAT' OR lo.priority = 'Urgent')
                         AND lo.status NOT IN ('Completed', 'Cancelled')
                         AND lo.ordered_at::date >= $2::date 
                         AND lo.ordered_at::date <= $3::date) as urgent_count,

                         -- Performance Metric (used for 'presentDays' in frontend)
                         -- Calculate days where nurse had at least one completed task or vital sign entry
                         (
                            SELECT COUNT(DISTINCT activity_date)
                            FROM (
                                SELECT lo.ordered_at::date as activity_date
                                FROM lab_orders lo
                                WHERE lo.assigned_nurse_id = n.nurse_id
                                AND lo.status = 'Completed'
                                AND lo.ordered_at::date >= $2::date 
                                AND lo.ordered_at::date <= $3::date
                                UNION
                                SELECT o.visit_date as activity_date
                                FROM opd_entries o
                                WHERE o.vital_signs IS NOT NULL
                                AND o.visit_date >= $2::date
                                AND o.visit_date <= $3::date
                                AND o.branch_id IN (SELECT branch_id FROM nurse_branches WHERE nurse_id = n.nurse_id)
                            ) as activity
                         ) as performance_metric
                        
                    FROM nurses n
                    JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
                    JOIN branches b ON nb.branch_id = b.branch_id
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
                        
                        -- Total Actions (Bookings + Checkins) - Kept for reference/sorting
                        (
                            (SELECT COUNT(*) FROM appointments a 
                             WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                             AND a.confirmed_by = s.user_id)
                            +
                            (SELECT COUNT(*) FROM opd_entries o 
                             WHERE o.visit_date >= $2::date AND o.visit_date <= $3::date 
                             AND o.checked_in_by = s.staff_code)
                        ) as task_count,

                        -- Performance Metric (Cancellations + No-shows handled/recorded)
                        (SELECT COUNT(*) FROM appointments a 
                         WHERE a.appointment_date >= $2::date AND a.appointment_date <= $3::date 
                         AND (a.cancelled_by = s.user_id OR (a.confirmed_by = s.user_id AND a.appointment_status = 'No-show'))) as performance_metric,
                         
                         -- Detailed Breakdown (Aliases match frontend StaffPerformance.tsx)
                         -- Updated: Total Appointments based on Branch ID (User Request: "number of patinet presernt in the appointment table, where this brach appoint shud be there")
                         (SELECT COUNT(*) FROM appointments a 
                          WHERE a.branch_id IN (SELECT branch_id FROM staff_branches sb WHERE sb.staff_id = s.staff_id)
                          AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as total_confirmed,
                         
                         -- Converted: OPD Entries with type 'Appointment' (User logic: Appointment -> OPD on same date)
                         (SELECT COUNT(*) FROM opd_entries o 
                          WHERE o.checked_in_by = s.staff_code 
                          AND o.visit_type = 'Appointment'
                          AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as appointments_converted,
                         
                         (SELECT COUNT(*) FROM opd_entries o WHERE o.checked_in_by = s.staff_code AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as opd_checkins,
                         
                         -- Walk-ins: OPD Entries with type 'Walk-in'
                         (SELECT COUNT(*) FROM opd_entries o 
                          WHERE o.checked_in_by = s.staff_code 
                          AND o.visit_type = 'Walk-in'
                          AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as walk_in_count,

                         -- Emergency: OPD Entries with type 'Emergency' or is_mlc=true
                         (SELECT COUNT(*) FROM opd_entries o 
                          WHERE o.checked_in_by = s.staff_code 
                          AND (o.visit_type = 'Emergency' OR o.is_mlc = true)
                          AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as emergency_count,

                         (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_status = 'No-show' AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as no_show_count,
                         
                         (SELECT COUNT(*) FROM appointments a WHERE a.cancelled_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as cancellations_handled,
                         
                         -- Financial Metrics (Added)
                         (SELECT COALESCE(SUM(paid_amount), 0) FROM billing_master bm 
                          WHERE bm.created_by = s.staff_code 
                          AND bm.billing_date::date >= $2::date 
                          AND bm.billing_date::date <= $3::date) as payments_collected,
                          
                         (SELECT COALESCE(SUM(pending_amount), 0) FROM billing_master bm 
                          WHERE bm.created_by = s.staff_code 
                          AND bm.billing_date::date >= $2::date 
                          AND bm.billing_date::date <= $3::date) as pending_amount,
                         
                         
                         -- Renamed/Duplicate for clarity/legacy
                         (SELECT COUNT(*) FROM opd_entries o WHERE o.checked_in_by = s.staff_code AND o.visit_date >= $2::date AND o.visit_date <= $3::date) as total_opd_entries,
                         (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) as total_appointments,
                         
                         -- Conversion Rate: Appointments that became OPD entries (calculated here just in case, though frontend does it too)
                         CASE 
                             WHEN (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date) > 0 
                             THEN ROUND(
                                 (SELECT COUNT(*) FROM appointments a 
                                  WHERE a.confirmed_by = s.user_id 
                                  AND a.appointment_status = 'Completed' 
                                  AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date)::numeric 
                                 / 
                                 (SELECT COUNT(*) FROM appointments a WHERE a.confirmed_by = s.user_id AND a.appointment_date >= $2::date AND a.appointment_date <= $3::date)::numeric 
                                 * 100, 2
                             )
                             ELSE 0
                         END as conversion_rate_percentage

                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE b.hospital_id = $1 AND s.staff_type = 'RECEPTIONIST'
                    GROUP BY s.staff_id, s.first_name, s.last_name, s.user_id, s.staff_code
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
