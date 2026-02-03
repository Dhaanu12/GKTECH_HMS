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

    static async getAnalytics(req, res, next) {
        try {
            const hospital_id = req.user.hospital_id;
            const { startDate, endDate } = req.query;

            if (!hospital_id) {
                return next(new AppError('Hospital not linked to your account', 403));
            }

            // Default to current date if not provided
            const start = startDate || new Date().toISOString().split('T')[0];
            const end = endDate || new Date().toISOString().split('T')[0];

            const client = await require('../config/db').pool.connect();
            try {
                // 1. Summary Stats (Total Patients, Revenue, MLCs)
                const summaryRes = await client.query(`
                    SELECT 
                        COUNT(*) as total_opd_visits,
                        COUNT(CASE WHEN o.is_mlc = true THEN 1 END) as total_mlc,
                        SUM(COALESCE(o.consultation_fee, 0)) as total_revenue,
                        COUNT(DISTINCT o.patient_id) as unique_patients
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                `, [hospital_id, start, end]);

                // 2. Doctor Performance
                const doctorRes = await client.query(`
                    SELECT 
                        d.first_name, 
                        d.last_name, 
                        d.specialization,
                        COUNT(o.opd_id) as patient_count,
                        SUM(COALESCE(o.consultation_fee, 0)) as revenue_generated
                    FROM opd_entries o
                    JOIN doctors d ON o.doctor_id = d.doctor_id
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY d.doctor_id, d.first_name, d.last_name, d.specialization
                    ORDER BY patient_count DESC
                    LIMIT 10
                `, [hospital_id, start, end]);

                // 3. Department Analysis
                const deptRes = await client.query(`
                    SELECT 
                        dp.department_name,
                        COUNT(o.opd_id) as patient_count
                    FROM opd_entries o
                    JOIN departments dp ON o.department_id = dp.department_id
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY dp.department_id, dp.department_name
                    ORDER BY patient_count DESC
                `, [hospital_id, start, end]);

                // 4. Daily Trend (within selected range)
                const trendRes = await client.query(`
                    SELECT 
                        TO_CHAR(o.visit_date, 'YYYY-MM-DD') as period_label,
                        COUNT(o.opd_id) as count
                    FROM opd_entries o
                    JOIN branches b ON o.branch_id = b.branch_id
                    WHERE b.hospital_id = $1
                    AND o.visit_date >= $2::date AND o.visit_date <= $3::date
                    GROUP BY o.visit_date
                    ORDER BY o.visit_date ASC
                `, [hospital_id, start, end]);

                res.status(200).json({
                    status: 'success',
                    data: {
                        summary: summaryRes.rows[0],
                        doctorStats: doctorRes.rows,
                        deptStats: deptRes.rows,
                        trends: trendRes.rows
                    }
                });
            } finally {
                client.release();
            }
        } catch (error) {
            console.error('Get analytics error:', error);
            next(new AppError('Failed to fetch analytics', 500));
        }
    }
}

module.exports = ClientAdminController;
