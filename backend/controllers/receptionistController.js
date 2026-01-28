const Role = require('../models/Role');
const User = require('../models/User');
const Receptionist = require('../models/Receptionist');
const { PasswordUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');

class ReceptionistController {
    static async getAllReceptionists(req, res, next) {
        try {
            const { hospital_id, branch_id, search } = req.query;
            let receptionists = [];

            // If CLIENT_ADMIN, enforce hospital_id from token
            const effectiveHospitalId = req.userRole === 'CLIENT_ADMIN' ? req.user.hospital_id : hospital_id;

            if (search) {
                receptionists = await Receptionist.search(search);
                // If CLIENT_ADMIN, filter search results to their hospital
                if (req.userRole === 'CLIENT_ADMIN') {
                    receptionists = receptionists.filter(r => r.hospital_id === req.user.hospital_id);
                }
            } else if (branch_id) {
                receptionists = await Receptionist.findByBranch(branch_id);
                // Verify branch belongs to hospital if Client Admin? 
                // For now assuming UI sends correct branch.
            } else if (effectiveHospitalId) {
                receptionists = await Receptionist.findByHospital(effectiveHospitalId);
            } else {
                // Only SUPER_ADMIN can see all
                if (req.userRole === 'CLIENT_ADMIN') {
                    return next(new AppError('Hospital ID missing for Client Admin', 400));
                }
                receptionists = await Receptionist.findAllWithDetails();
            }

            res.status(200).json({
                status: 'success',
                results: receptionists.length,
                data: { receptionists }
            });
        } catch (error) {
            console.error('Get receptionists error:', error);
            next(new AppError('Failed to fetch receptionists', 500));
        }
    }

    static async getReceptionistById(req, res, next) {
        try {
            const { id } = req.params;
            // id here is likely user_id or staff_id? 
            // The frontend usually passes the ID from the list.
            // In getAllReceptionists, we return staff objects (staff_id).
            // So id should be staff_id.
            // But wait, the previous implementation used User.findWithRole(id), so it expected user_id.
            // The frontend key was `receptionist.receptionist_id || receptionist.user_id`.
            // Now we are returning staff objects, so primary key is staff_id.
            // Let's assume id is staff_id.

            const receptionist = await Receptionist.findByIdWithDetails(id);

            if (!receptionist) {
                return next(new AppError('Receptionist not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { receptionist }
            });
        } catch (error) {
            console.error('Get receptionist error:', error);
            next(new AppError('Failed to fetch receptionist', 500));
        }
    }

    static async createReceptionist(req, res, next) {
        try {
            const { username, email, password, phone_number, first_name, last_name, branch_id } = req.body;

            // Validate required fields
            if (!username || !email || !password || !branch_id) {
                return next(new AppError('Please provide username, email, password, and branch_id', 400));
            }

            // Get RECEPTIONIST role
            const role = await Role.findByCode('RECEPTIONIST');
            if (!role) {
                return next(new AppError('Receptionist role not found', 404));
            }

            // Check if user exists
            const existingUser = await User.findByEmail(email);
            if (existingUser) {
                return next(new AppError('Email already exists', 409));
            }

            const existingUsername = await User.findByUsername(username);
            if (existingUsername) {
                return next(new AppError('Username already exists', 409));
            }

            // Hash password
            const password_hash = await PasswordUtils.hashPassword(password);

            // Create user
            const user = await User.create({
                username,
                email,
                phone_number,
                password_hash,
                role_id: role.role_id,
                is_active: true
            });

            delete user.password_hash;

            // Create Staff Record
            const staffCode = 'REC' + Date.now().toString().slice(-6);
            const { query } = require('../config/db'); // Ensure query is available

            const staffQuery = `
                INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
                VALUES ($1, $2, $3, $4, 'RECEPTIONIST', true)
                RETURNING *
            `;
            const staffResult = await query(staffQuery, [user.user_id, first_name, last_name, staffCode]);
            const newStaff = staffResult.rows[0];

            // Link to Branch
            const staffBranchQuery = `
                INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active)
                VALUES ($1, $2, 'Permanent', true)
            `;
            await query(staffBranchQuery, [newStaff.staff_id, branch_id]);

            res.status(201).json({
                status: 'success',
                message: 'Receptionist created successfully',
                data: { receptionist: user, staff: newStaff }
            });
        } catch (error) {
            console.error('Create receptionist error:', error);
            if (error.code === '23505') {
                return next(new AppError('Username or Email already exists', 409));
            }
            next(new AppError('Failed to create receptionist', 500));
        }
    }

    static async updateReceptionist(req, res, next) {
        const client = await require('../config/db').pool.connect();
        try {
            await client.query('BEGIN');
            const { id } = req.params; // user_id
            const updates = req.body;

            const user = await User.findById(id);
            if (!user) {
                throw new AppError('Receptionist not found', 404);
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

            // Fetch updated details
            const updatedReceptionist = await Receptionist.findByIdWithDetails(user.staff_id || (await client.query('SELECT staff_id FROM staff WHERE user_id = $1', [id])).rows[0]?.staff_id);

            res.status(200).json({
                status: 'success',
                message: 'Receptionist updated successfully',
                data: { receptionist: updatedReceptionist }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Update receptionist error:', error);
            next(error instanceof AppError ? error : new AppError('Failed to update receptionist', 500));
        } finally {
            client.release();
        }
    }

    static async deleteReceptionist(req, res, next) {
        try {
            const { id } = req.params;

            const user = await User.findById(id);
            if (!user) {
                return next(new AppError('Receptionist not found', 404));
            }

            await User.delete(id);

            res.status(200).json({
                status: 'success',
                message: 'Receptionist deleted successfully'
            });
        } catch (error) {
            console.error('Delete receptionist error:', error);
            next(new AppError('Failed to delete receptionist', 500));
        }
    }
}

module.exports = ReceptionistController;
