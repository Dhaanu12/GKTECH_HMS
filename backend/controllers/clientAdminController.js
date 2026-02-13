const Role = require('../models/Role');
const User = require('../models/User');
const ClientAdmin = require('../models/ClientAdmin');
const { PasswordUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');

class ClientAdminController {
    static async getAllClientAdmins(req, res, next) {
        try {
            const { hospital_id, search } = req.query;
            let clientAdmins = [];

            if (req.userRole === 'CLIENT_ADMIN') {
                // For CLIENT_ADMIN: only show admins from their hospital
                if (!req.user.hospital_id) {
                    return next(new AppError('Hospital not linked to your account', 403));
                }

                if (search) {
                    // Filter search results by hospital
                    const results = await ClientAdmin.search(search);
                    clientAdmins = results.filter(admin => admin.hospital_id === req.user.hospital_id);
                } else {
                    clientAdmins = await ClientAdmin.findByHospital(req.user.hospital_id);
                }
            } else {
                // For SUPER_ADMIN
                if (search) {
                    clientAdmins = await ClientAdmin.search(search);
                } else if (hospital_id) {
                    clientAdmins = await ClientAdmin.findByHospital(hospital_id);
                } else {
                    clientAdmins = await ClientAdmin.findAllWithDetails();
                }
            }

            res.status(200).json({
                status: 'success',
                results: clientAdmins.length,
                data: { clientAdmins }
            });
        } catch (error) {
            console.error('Get client admins error:', error);
            next(new AppError('Failed to fetch client admins', 500));
        }
    }

    static async getMyHospitalClientAdmins(req, res, next) {
        // This method seems redundant now as getAllClientAdmins handles the logic based on role.
        // But keeping it for backward compatibility if used elsewhere.
        try {
            if (!req.user.hospital_id) {
                return next(new AppError('Hospital not linked to your account', 403));
            }
            const clientAdmins = await ClientAdmin.findByHospital(req.user.hospital_id);
            res.status(200).json({
                status: 'success',
                data: { clientAdmins }
            });
        } catch (error) {
            console.error('Get my hospital client admins error:', error);
            next(new AppError('Failed to fetch client admins', 500));
        }
    }

    static async getClientAdminById(req, res, next) {
        try {
            const { id } = req.params;
            const clientAdmin = await ClientAdmin.findByIdWithDetails(id);

            if (!clientAdmin) {
                return next(new AppError('Client Admin not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { clientAdmin }
            });
        } catch (error) {
            console.error('Get client admin error:', error);
            next(new AppError('Failed to fetch client admin', 500));
        }
    }

    static async createClientAdmin(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            await client.query('BEGIN');

            const { username, email, password, phone_number, first_name, last_name, hospital_id } = req.body;

            // Validate required fields
            if (!username || !email || !password || !hospital_id) {
                return next(new AppError('Please provide username, email, password, and hospital_id', 400));
            }

            // Get CLIENT_ADMIN role
            const roleResult = await client.query("SELECT role_id FROM roles WHERE role_code = 'CLIENT_ADMIN'");
            const roleId = roleResult.rows[0]?.role_id;
            if (!roleId) {
                throw new AppError('Client Admin role not found', 404);
            }

            // Check if user exists
            const existingUserResult = await client.query('SELECT user_id FROM users WHERE email = $1', [email]);
            if (existingUserResult.rows.length > 0) {
                throw new AppError('Email already exists', 409);
            }

            // Hash password
            const password_hash = await PasswordUtils.hashPassword(password);

            // Create user
            const userQuery = `
                INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
                VALUES ($1, $2, $3, $4, $5, true, true)
                RETURNING user_id, username, email, role_id
            `;
            const userResult = await client.query(userQuery, [username, email, phone_number, password_hash, roleId]);
            const newUser = userResult.rows[0];

            // --- Link to Hospital via Staff & Branch ---

            // 1. Get the first branch of the hospital
            const branchResult = await client.query(
                'SELECT branch_id FROM branches WHERE hospital_id = $1 ORDER BY branch_id ASC LIMIT 1',
                [hospital_id]
            );

            if (branchResult.rows.length === 0) {
                throw new AppError('Selected hospital has no branches. Cannot assign admin.', 400);
            }
            const branchId = branchResult.rows[0].branch_id;

            // 2. Create Staff record
            const staffCode = 'ADM' + Date.now().toString().slice(-6);
            const staffQuery = `
                INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
                VALUES ($1, $2, $3, $4, 'ADMIN', true)
                RETURNING staff_id
            `;
            const staffResult = await client.query(staffQuery, [newUser.user_id, first_name, last_name, staffCode]);
            const newStaff = staffResult.rows[0];

            // 3. Link Staff to Branch
            await client.query(
                "INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active) VALUES ($1, $2, 'Permanent', true)",
                [newStaff.staff_id, branchId]
            );

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Client Admin created and linked to hospital successfully',
                data: { clientAdmin: newUser }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create client admin error:', error);
            next(error instanceof AppError ? error : new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }

    static async updateClientAdmin(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            await client.query('BEGIN');
            const { id } = req.params;
            const updates = req.body;

            // If CLIENT_ADMIN, they can only update themselves
            if (req.userRole === 'CLIENT_ADMIN') {
                if (req.user.user_id !== parseInt(id)) {
                    throw new AppError('You can only update your own profile', 403);
                }
            }

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('Client Admin not found', 404);
            }

            // Update User table
            const userUpdates = {};
            if (updates.username) userUpdates.username = updates.username;
            if (updates.email) userUpdates.email = updates.email;
            if (updates.phone_number) userUpdates.phone_number = updates.phone_number;

            if (updates.password) {
                userUpdates.password_hash = await PasswordUtils.hashPassword(updates.password);
            }

            let updatedUser = user;
            if (Object.keys(userUpdates).length > 0) {
                updatedUser = await User.update(id, userUpdates, client);
                delete updatedUser.password_hash;
            }

            // Update Staff table (first_name, last_name)
            if (updates.first_name || updates.last_name) {
                const staffUpdates = [];
                const values = [];
                let paramCount = 1;

                if (updates.first_name) {
                    staffUpdates.push(`first_name = $${paramCount}`);
                    values.push(updates.first_name);
                    paramCount++;
                }
                if (updates.last_name) {
                    staffUpdates.push(`last_name = $${paramCount}`);
                    values.push(updates.last_name);
                    paramCount++;
                }

                if (staffUpdates.length > 0) {
                    values.push(id); // user_id
                    await client.query(
                        `UPDATE staff SET ${staffUpdates.join(', ')} WHERE user_id = $${paramCount}`,
                        values
                    );
                }
            }

            await client.query('COMMIT');

            // Fetch updated details to return
            const updatedClientAdmin = await ClientAdmin.findByIdWithDetails(user.staff_id || (await client.query('SELECT staff_id FROM staff WHERE user_id = $1', [id])).rows[0]?.staff_id);

            res.status(200).json({
                status: 'success',
                message: 'Client Admin updated successfully',
                data: { clientAdmin: updatedClientAdmin }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Update client admin error:', error);
            next(error instanceof AppError ? error : new AppError('Failed to update client admin', 500));
        } finally {
            client.release();
        }
    }

    static async deleteClientAdmin(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return next(new AppError('Client Admin not found', 404));
            }

            await User.delete(id);

            res.status(200).json({
                status: 'success',
                message: 'Client Admin deleted successfully'
            });
        } catch (error) {
            console.error('Delete client admin error:', error);
            next(new AppError('Failed to delete client admin', 500));
        }
    }

    static async getDashboardStats(req, res, next) {
        try {
            const hospital_id = req.user.hospital_id;
            if (!hospital_id) {
                return next(new AppError('Hospital not linked to your account', 403));
            }

            const client = await require('../config/db').pool.connect();
            try {
                // 1. Total Branches
                const branchesRes = await client.query(
                    'SELECT COUNT(*) FROM branches WHERE hospital_id = $1',
                    [hospital_id]
                );

                // 2. Total Doctors (linked to any branch of this hospital)
                const doctorsRes = await client.query(`
                    SELECT COUNT(DISTINCT d.doctor_id) 
                    FROM doctors d
                    JOIN doctor_branches db ON d.doctor_id = db.doctor_id
                    JOIN branches b ON db.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                `, [hospital_id]);

                // 3. Total Nurses (linked to any branch of this hospital)
                const nursesRes = await client.query(`
                    SELECT COUNT(DISTINCT n.nurse_id) 
                    FROM nurses n
                    JOIN nurse_branches nb ON n.nurse_id = nb.nurse_id
                    JOIN branches b ON nb.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                `, [hospital_id]);

                // 4. Total Receptionists (linked to any branch of this hospital)
                const receptionistsRes = await client.query(`
                    SELECT COUNT(DISTINCT s.staff_id) 
                    FROM staff s
                    JOIN staff_branches sb ON s.staff_id = sb.staff_id
                    JOIN branches b ON sb.branch_id = b.branch_id
                    WHERE b.hospital_id = $1 AND s.staff_type = 'RECEPTIONIST'
                `, [hospital_id]);

                res.status(200).json({
                    status: 'success',
                    data: {
                        stats: {
                            branches: parseInt(branchesRes.rows[0].count),
                            doctors: parseInt(doctorsRes.rows[0].count),
                            nurses: parseInt(nursesRes.rows[0].count),
                            receptionists: parseInt(receptionistsRes.rows[0].count)
                        }
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get dashboard stats error:', error);
            next(new AppError('Failed to fetch dashboard stats', 500));
        }
    }

    // static async getAnalytics(req, res, next) {
    //     try {
    //         const hospital_id = req.user.hospital_id;
    //         const { startDate, endDate } = req.query;

    //         if (!hospital_id) {
    //             return next(new AppError('Hospital not linked to your account', 403));
    //         }

    //         // Default to current date if not provided
    //         const start = startDate || new Date().toISOString().split('T')[0];
    //         const end = endDate || new Date().toISOString().split('T')[0];

    //         const client = await require('../config/db').pool.connect();
    //         try {
    //             // 1. Summary Stats (Total Patients, Revenue, MLCs)
    //             const summaryRes = await client.query(`
    //                 SELECT 
    //                     COUNT(*) as total_opd_visits,
    //                     COUNT(CASE WHEN o.is_mlc = true THEN 1 END) as total_mlc,
    //                     SUM(COALESCE(o.consultation_fee, 0)) as total_revenue,
    //                     COUNT(DISTINCT o.patient_id) as unique_patients
    //                 FROM opd_entries o
    //                 JOIN branches b ON o.branch_id = b.branch_id
    //                 WHERE b.hospital_id = $1
    //                 AND o.visit_date >= $2::date AND o.visit_date <= $3::date
    //             `, [hospital_id, start, end]);

    //             // 2. Doctor Performance
    //             const doctorRes = await client.query(`
    //                 SELECT 
    //                     d.first_name, 
    //                     d.last_name, 
    //                     d.specialization,
    //                     COUNT(o.opd_id) as patient_count,
    //                     SUM(COALESCE(o.consultation_fee, 0)) as revenue_generated
    //                 FROM opd_entries o
    //                 JOIN doctors d ON o.doctor_id = d.doctor_id
    //                 JOIN branches b ON o.branch_id = b.branch_id
    //                 WHERE b.hospital_id = $1
    //                 AND o.visit_date >= $2::date AND o.visit_date <= $3::date
    //                 GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
    //                 ORDER BY patient_count DESC
    //                 LIMIT 10
    //             `, [hospital_id, start, end]);

    //             // 3. Department Analysis
    //             const deptRes = await client.query(`
    //                 SELECT 
    //                     dp.department_name,
    //                     COUNT(o.opd_id) as patient_count
    //                 FROM opd_entries o
    //                 JOIN departments dp ON o.department_id = dp.department_id
    //                 JOIN branches b ON o.branch_id = b.branch_id
    //                 WHERE b.hospital_id = $1
    //                 AND o.visit_date >= $2::date AND o.visit_date <= $3::date
    //                 GROUP BY dp.department_id, dp.department_name
    //                 ORDER BY patient_count DESC
    //             `, [hospital_id, start, end]);

    //             // 4. Daily Trend (within selected range)
    //             const trendRes = await client.query(`
    //                 SELECT 
    //                     TO_CHAR(o.visit_date, 'YYYY-MM-DD') as period_label,
    //                     COUNT(o.opd_id) as count
    //                 FROM opd_entries o
    //                 JOIN branches b ON o.branch_id = b.branch_id
    //                 WHERE b.hospital_id = $1
    //                 AND o.visit_date >= $2::date AND o.visit_date <= $3::date
    //                 GROUP BY o.visit_date
    //                 ORDER BY o.visit_date ASC
    //             `, [hospital_id, start, end]);

    //             res.status(200).json({
    //                 status: 'success',
    //                 data: {
    //                     summary: summaryRes.rows[0],
    //                     doctorStats: doctorRes.rows,
    //                     deptStats: deptRes.rows,
    //                     trends: trendRes.rows
    //                 }
    //             });
    //         } finally {
    //             client.release();
    //         }
    //     } catch (error) {
    //         console.error('Get analytics error:', error);
    //         next(new AppError('Failed to fetch analytics', 500));
    //     }
    // }
    static async getAnalytics(req, res, next) {
        try {
            const hospital_id = req.user.hospital_id;
            let { startDate, endDate } = req.query;

            console.log('==========================================');
            console.log('ANALYTICS REQUEST RECEIVED');
            console.log('==========================================');
            console.log('Hospital ID:', hospital_id);
            console.log('startDate:', startDate);
            console.log('endDate:', endDate);

            if (!hospital_id) {
                return next(new AppError('Hospital not linked to your account', 403));
            }

            if (!startDate || !endDate) {
                startDate = startDate || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = endDate || new Date().toISOString().split('T')[0];
            }

            const start = startDate.trim();
            const end = endDate.trim();

            console.log('Using date range:', start, 'to', end);

            const client = await require('../config/db').pool.connect();
            try {
                // 1. Summary Stats
                const summaryRes = await client.query(`
                    SELECT 
                        COUNT(*)::text as total_opd_visits,
                        COUNT(CASE WHEN o.is_mlc = true THEN 1 END)::text as total_mlc,
                        COALESCE(SUM(o.consultation_fee), 0)::text as total_revenue,
                        COUNT(DISTINCT o.patient_id)::text as unique_patients
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date 
                    AND DATE(o.visit_date) <= $3::date
                `, [hospital_id, start, end]);

                // 2. Doctor Performance
                const doctorRes = await client.query(`
                    SELECT 
                        d.first_name, 
                        d.last_name, 
                        d.specialization,
                        COUNT(o.opd_id)::text as patient_count,
                        COALESCE(SUM(o.consultation_fee), 0)::text as revenue_generated
                    FROM opd_entries o
                    JOIN doctors d ON o.doctor_id = d.doctor_id
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date 
                    AND DATE(o.visit_date) <= $3::date
                    GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
                    ORDER BY SUM(o.consultation_fee) DESC
                    LIMIT 10
                `, [hospital_id, start, end]);

                // 3. Department Analysis
                const deptRes = await client.query(`
                    SELECT 
                        dp.department_name,
                        COUNT(o.opd_id)::text as patient_count
                    FROM opd_entries o
                    JOIN departments dp ON o.department_id = dp.department_id
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date 
                    AND DATE(o.visit_date) <= $3::date
                    GROUP BY dp.department_id, dp.department_name
                    ORDER BY COUNT(o.opd_id) DESC
                `, [hospital_id, start, end]);

                // 4. Daily Trend - FIXED: Use DATE() to extract date from timestamp
                const trendRes = await client.query(`
                    SELECT 
                        TO_CHAR(DATE(o.visit_date), 'YYYY-MM-DD') as period_label,
                        COUNT(o.opd_id)::text as count
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date 
                    AND DATE(o.visit_date) <= $3::date
                    GROUP BY DATE(o.visit_date)
                    ORDER BY DATE(o.visit_date) ASC
                `, [hospital_id, start, end]);

                console.log(`Found ${trendRes.rows.length} days with data`);
                if (trendRes.rows.length > 0) {
                    console.log('First trend:', trendRes.rows[0]);
                    console.log('Last trend:', trendRes.rows[trendRes.rows.length - 1]);
                }

                const responseData = {
                    summary: summaryRes.rows[0],
                    doctorStats: doctorRes.rows,
                    deptStats: deptRes.rows,
                    trends: trendRes.rows
                };

                console.log('Response summary:', {
                    visits: responseData.summary.total_opd_visits,
                    revenue: responseData.summary.total_revenue,
                    trendPoints: responseData.trends.length,
                    doctors: responseData.doctorStats.length,
                    departments: responseData.deptStats.length
                });
                console.log('==========================================');

                res.status(200).json({
                    status: 'success',
                    data: responseData
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Analytics error:', error);
            next(new AppError('Failed to fetch analytics', 500));
        }
    }
    static async getExecutiveStats(req, res, next) {
        try {
            const hospital_id = req.user.hospital_id;
            let { startDate, endDate } = req.query;

            console.log('=== GET EXECUTIVE STATS ===');
            console.log('Hospital ID:', hospital_id);
            console.log('Requested Range:', startDate, 'to', endDate);

            console.log('=== GET EXECUTIVE STATS ===');
            console.log('Hospital ID:', hospital_id);
            console.log('Requested Range:', startDate, 'to', endDate);

            if (!hospital_id) {
                return next(new AppError('Hospital not linked to your account', 403));
            }

            // Default to current date/month if not provided
            // For trends, we usually show 6 months back from "End Date"
            const queryDate = endDate ? endDate : new Date().toISOString().split('T')[0];
            const startQueryDate = startDate ? startDate : queryDate; // If no start, just use single day for daily stats?
            // Actually, for "Dashboard" mode (no dates), we want Today for KPIs and Month for Revenue.
            // For "Report" mode (dates provided), we want aggregates over that range.

            const isReportMode = !!(startDate && endDate);

            // Calculate date parameters based on mode
            // For Dashboard Mode: Use current year start to today
            // For Report Mode: Use user-provided startDate and endDate
            const effectiveStartDate = isReportMode ? startDate : (new Date().getFullYear() + '-01-01');
            const effectiveEndDate = isReportMode ? endDate : queryDate;

            console.log('isReportMode:', isReportMode);
            console.log('Effective date range - Start:', effectiveStartDate, 'End:', effectiveEndDate);

            const client = await require('../config/db').pool.connect();
            try {
                let patientsTodayRes, revenueMonthRes, revenueTrendRes, diagnosisRes, peakHoursRes, retentionRes, labOrdersRes, pharmacyRes;

                if (isReportMode) {
                    // --- REPORT MODE (Aggregated over range) ---

                    // 1. Patients via Opd entries in range
                    patientsTodayRes = await client.query(`
                        SELECT COUNT(*) 
                        FROM opd_entries o
                        JOIN branches b ON o.branch_id = b.branch_id
                        WHERE b.hospital_id = $1 
                        AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                    `, [hospital_id, startDate, endDate]);

                    // 2. Revenue in range
                    revenueMonthRes = await client.query(`
                        WITH opd_rev AS (
                            SELECT COALESCE(SUM(consultation_fee), 0) as val 
                            FROM opd_entries o
                            JOIN branches b ON o.branch_id = b.branch_id
                            WHERE b.hospital_id = $1 
                            AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                        ),
                        bill_rev AS (
                            SELECT COALESCE(SUM(d.final_price), 0) as val
                            FROM bill_details d
                            JOIN billing_master bm ON d.bill_master_id = bm.bill_master_id
                            JOIN branches b ON bm.branch_id = b.branch_id
                            WHERE b.hospital_id = $1
                            AND DATE(bm.billing_date) >= $2::date AND DATE(bm.billing_date) <= $3::date
                        )
                        SELECT (SELECT val FROM opd_rev) + (SELECT val FROM bill_rev) as total_revenue
                    `, [hospital_id, startDate, endDate]).catch(() => ({ rows: [{ total_revenue: 0 }] }));

                    // 3. Trend (Daily within range)
                    revenueTrendRes = await client.query(`
                        SELECT 
                             TO_CHAR(DATE(o.visit_date), 'DD Mon') as name,
                             COALESCE(SUM(o.consultation_fee), 0) as revenue
                         FROM opd_entries o
                         JOIN branches b ON o.branch_id = b.branch_id
                         WHERE b.hospital_id = $1
                         AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                         GROUP BY DATE(o.visit_date)
                         ORDER BY DATE(o.visit_date)
                     `, [hospital_id, startDate, endDate]);

                    // 4. Clinical (Diagnoses in range)
                    diagnosisRes = await client.query(`
                        SELECT 
                            COALESCE(o.diagnosis, 'Unspecified') as name,
                            COUNT(*) as count
                        FROM opd_entries o
                        JOIN branches b ON o.branch_id = b.branch_id
                        WHERE b.hospital_id = $1
                        AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                        AND o.diagnosis IS NOT NULL
                        GROUP BY o.diagnosis
                        ORDER BY count DESC
                        LIMIT 5
                    `, [hospital_id, startDate, endDate]);

                    // 5. Operational (Peak Hours in range)
                    peakHoursRes = await client.query(`
                        SELECT 
                            EXTRACT(HOUR FROM a.appointment_time) as hour,
                            COUNT(*) as patients
                        FROM appointments a
                        JOIN branches b ON a.branch_id = b.branch_id
                        WHERE b.hospital_id = $1
                        AND DATE(a.appointment_date) >= $2::date AND DATE(a.appointment_date) <= $3::date
                        GROUP BY EXTRACT(HOUR FROM a.appointment_time)
                        ORDER BY hour ASC
                    `, [hospital_id, startDate, endDate]);

                    // 6. Revenue Trend (Daily)
                    revenueTrendRes = await client.query(`
                        SELECT 
                            to_char(date_trunc('day', i.billing_date), 'YYYY-MM-DD') as period_label,
                            SUM(d.final_price) as revenue
                        FROM bill_details d
                        JOIN billing_master i ON d.bill_master_id = i.bill_master_id
                        JOIN branches b ON i.branch_id = b.branch_id
                        WHERE b.hospital_id = $1
                        AND DATE(i.billing_date) >= $2::date AND DATE(i.billing_date) <= $3::date
                        GROUP BY 1
                        ORDER BY 1
                    `, [hospital_id, startDate, endDate]);
                } else {
                    // --- DASHBOARD MODE (Default views) ---

                    // 1. Patients Today (KPI)
                    patientsTodayRes = await client.query(`
                        SELECT COUNT(*) 
                        FROM opd_entries o
                        JOIN branches b ON o.branch_id = b.branch_id
                        WHERE b.hospital_id = $1 AND DATE(o.visit_date) = CURRENT_DATE
                        `, [hospital_id]);

                    // 2. Revenue This Month (KPI)
                    revenueMonthRes = await client.query(`
                        WITH opd_rev AS(
                            SELECT COALESCE(SUM(consultation_fee), 0) as val 
                            FROM opd_entries o
                            JOIN branches b ON o.branch_id = b.branch_id
                            WHERE b.hospital_id = $1 
                            AND date_trunc('month', o.visit_date) = date_trunc('month', CURRENT_DATE)
                        ),
                        bill_rev AS(
                            SELECT COALESCE(SUM(d.final_price), 0) as val
                            FROM bill_details d
                            JOIN billing_master i ON d.bill_master_id = i.bill_master_id
                            JOIN branches b ON i.branch_id = b.branch_id
                            WHERE b.hospital_id = $1
                            AND date_trunc('month', i.billing_date) = date_trunc('month', CURRENT_DATE)
                        )
                    SELECT(SELECT val FROM opd_rev) + (SELECT val FROM bill_rev) as total_revenue
                        `, [hospital_id]);

                    // 3. Revenue Trend (Last 6 months)
                    // We need to aggregate by Month for the dashboard trend
                    revenueTrendRes = await client.query(`
                    SELECT
                    to_char(date_trunc('month', i.billing_date), 'Mon') as name,
                        SUM(d.final_price) as revenue
                        FROM bill_details d
                        JOIN billing_master i ON d.bill_master_id = i.bill_master_id
                        JOIN branches b ON i.branch_id = b.branch_id
                        WHERE b.hospital_id = $1
                        AND i.billing_date >= NOW() - INTERVAL '6 months'
                        GROUP BY 1, date_trunc('month', i.billing_date)
                        ORDER BY date_trunc('month', i.billing_date)
                        `, [hospital_id]).catch(err => { console.error(err); return { rows: [] }; });
                }

                // --- COMMON QUERIES (Both Modes) ---

                // 4. Clinical: Top 5 Diagnoses
                diagnosisRes = await client.query(`
                    SELECT diagnosis as name, COUNT(*) as count 
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1 
                    AND o.diagnosis IS NOT NULL AND o.diagnosis != ''
                    AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                    GROUP BY 1 
                    ORDER BY 2 DESC 
                    LIMIT 5
                        `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error(err); return { rows: [] }; });

                // 5. Operational: Peak Hours (based on visit_time usually, but let's use created_at casting to hour if needed or mock logically)
                // Assuming visit_date is timestamp or we have created_at. opd_entries usually has time.
                // If not, we'll try created_at.
                peakHoursRes = await client.query(`
                    SELECT
                    EXTRACT(HOUR FROM o.created_at) as hour_num,
                        COUNT(*) as patients
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                    GROUP BY 1
                    ORDER BY 1
                        `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error(err); return { rows: [] }; });

                // 6. Patient Retention (Returning vs New)
                // Simplified: First visit ever vs Repeat. 
                // Hard to do strictly without complex subquery. 
                // Approx: "Is Follow Up" field often exists?
                // Or just count patient_id occurrences > 1.
                // Let's us visit_type if available (New vs Review).
                // Checking opd_entries columns? Let's assume visit_type exists or we query patient visit counts.
                // Fallback: Just return rough stats if schema unknown.
                retentionRes = await client.query(`
                    SELECT 
                        CASE WHEN visit_type = 'New' THEN 'New' ELSE 'Returning' END as name,
                        COUNT(*) as value
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(o.visit_date) >= $2::date AND DATE(o.visit_date) <= $3::date
                    GROUP BY 1
                        `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error(err); return { rows: [] }; });


                // 7. Revenue Breakdown (By Service Category)
                const revenueBreakdownRes = await client.query(`
                    SELECT
                    COALESCE(NULLIF(d.service_type, ''), 'Other') as name,
                        SUM(d.final_price) as value
                    FROM bill_details d
                    JOIN billing_master i ON d.bill_master_id = i.bill_master_id
                    JOIN branches b ON i.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(i.billing_date) >= $2::date AND DATE(i.billing_date) <= $3::date
                    GROUP BY 1
                    ORDER BY 2 DESC
                        `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error(err); return { rows: [] }; });

                // 8. High Value Patients
                const highValueRes = await client.query(`
                    SELECT
                    p.first_name || ' ' || p.last_name as name,
                        MAX(i.billing_date) as last_visit,
                        SUM(i.total_amount) as total_spend,
                        'Active' as status
                    FROM billing_master i
                    JOIN patients p ON i.patient_id = p.patient_id
                    JOIN branches b ON i.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    GROUP BY p.patient_id
                    ORDER BY total_spend DESC
                    LIMIT 10
                        `, [hospital_id]).catch(err => { console.error(err); return { rows: [] }; });

                // 9. Claim Stats (from insurance_claims)
                const claimsRes = await client.query(`
                    SELECT
                    COUNT(*) as submitted,
                        COUNT(CASE WHEN approval_amount > 0 THEN 1 END) as approved,
                        COUNT(CASE WHEN pending_amount > 0 THEN 1 END) as pending
                    FROM insurance_claims ic
                    JOIN branches b ON ic.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(ic.created_at) >= $2::date AND DATE(ic.created_at) <= $3::date
                `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error(err); return { rows: [{ submitted: 0, approved: 0 }] }; });

                // 10. Lab Intelligence
                labOrdersRes = await client.query(`
                    SELECT 
                        COUNT(*) as total,
                        COUNT(CASE WHEN status = 'Completed' THEN 1 END) as completed,
                        COUNT(CASE WHEN status IN ('Pending', 'In-Progress', 'Ordered') THEN 1 END) as pending
                    FROM lab_orders lo
                    JOIN branches b ON lo.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND DATE(lo.ordered_at) >= $2::date AND DATE(lo.ordered_at) <= $3::date
                `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error('Lab stats error', err); return { rows: [{ total: 0, completed: 0, pending: 0 }] }; });

                // 11. Pharmacy Intelligence (Prescriptions)
                pharmacyRes = await client.query(`
                     SELECT COUNT(*) as total
                     FROM prescriptions p
                     JOIN branches b ON p.branch_id = b.branch_id
                     WHERE b.hospital_id = $1
                     AND DATE(p.created_at) >= $2::date AND DATE(p.created_at) <= $3::date
                `, [hospital_id, effectiveStartDate, effectiveEndDate]).catch(err => { console.error('Pharmacy stats error', err); return { rows: [{ total: 0 }] }; });




                const patientsCount = parseInt(patientsTodayRes?.rows[0]?.count || 0);
                const revenueAmount = parseFloat(patientsTodayRes?.rows[0]?.total_revenue || revenueMonthRes?.rows[0]?.total_revenue || 0);

                // Peak Hour formatting
                const formattedPeakHours = peakHoursRes.rows.map(r => ({
                    time: `${r.hour_num}:00`,
                    patients: parseInt(r.patients)
                }));

                // Retention formatting
                const retentionData = retentionRes.rows.map(r => ({
                    name: r.name || 'Returning',
                    value: parseInt(r.value),
                    color: r.name === 'New' ? '#3b82f6' : '#10b981'
                }));
                // Check if empty, populate basic fallback? No, let frontend handle "No Data"

                // Revenue Breakdown Formatting
                const breakdownData = revenueBreakdownRes.rows.map((r, idx) => ({
                    name: r.name,
                    value: Math.round(parseFloat(r.value)),
                    color: ['#3b82f6', '#10b981', '#f59e0b', '#6366f1', '#ec4899'][idx % 5]
                }));

                res.status(200).json({
                    status: 'success',
                    data: {
                        kpi: {
                            total_patients_today: patientsCount,
                            revenue_month: revenueAmount,
                            claims: claimsRes.rows[0],
                            lab: {
                                total: parseInt(labOrdersRes?.rows[0]?.total || 0),
                                completed: parseInt(labOrdersRes?.rows[0]?.completed || 0),
                                pending: parseInt(labOrdersRes?.rows[0]?.pending || 0)
                            },
                            pharmacy: {
                                total_prescriptions: parseInt(pharmacyRes?.rows[0]?.total || 0)
                            }
                        },
                        revenue_trend: revenueTrendRes.rows.map(r => ({
                            name: r.name || r.period_label,
                            revenue: parseFloat(r.revenue)
                        })),
                        revenue_breakdown: breakdownData,
                        diagnoses: diagnosisRes.rows,
                        peak_hours: formattedPeakHours,
                        retention: retentionData,
                        high_value_patients: highValueRes.rows,
                        // Add explicit efficienty metrics if calculate-able, else let frontend derive or show N/A
                        efficiency: {
                            patients_per_doctor: 0 // TODO: calculate if needed
                        }
                    }
                });

            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get executive stats error:', error);
            next(new AppError('Failed to fetch executive stats: ' + error.message, 500));
        }
    }
}

module.exports = ClientAdminController;
