const Hospital = require('../models/Hospital');
const Branch = require('../models/Branch');
const User = require('../models/User');
const Role = require('../models/Role');
const UserSession = require('../models/UserSession'); // For transaction support if needed, or use BaseModel
const { PasswordUtils } = require('../utils/authUtils');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/db');

class HospitalController {
    /**
     * Create Hospital, Main Branch, and Client Admin
     * Accessible by: SUPER_ADMIN
     */
    static async createHospital(req, res, next) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const {
                hospital_name, hospital_code, hospital_type,
                admin_name, admin_email, admin_phone, admin_password, admin_username,
                headquarters_address, contact_number, email, established_date, total_beds,
                enabled_modules
            } = req.body;

            // Parse enabled_modules if it's a string (multipart/form-data)
            let parsedModules = enabled_modules;
            if (typeof parsedModules === 'string') {
                try {
                    parsedModules = JSON.parse(parsedModules);
                } catch (e) {
                    parsedModules = [];
                }
            }
            // Normalize to object structure if array of strings
            if (Array.isArray(parsedModules)) {
                parsedModules = parsedModules.map(m => {
                    if (typeof m === 'string') return { id: m, is_active: true };
                    return m;
                });
            } else {
                parsedModules = [];
            }

            // Validate required fields
            if (!hospital_name || !hospital_code || !admin_email || !admin_password) {
                return next(new AppError('Please provide hospital_name, hospital_code, admin_email, and admin_password', 400));
            }

            // 1. Validate Admin Email/Username uniqueness
            const existingUser = await User.findByEmail(admin_email);
            if (existingUser) throw new AppError('Admin email already exists', 409);

            // 2. Create Hospital
            const hospitalQuery = `
        INSERT INTO hospitals (hospital_name, hospital_code, hospital_type, headquarters_address, contact_number, email, established_date, total_beds, logo_url, enabled_modules, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true)
        RETURNING *
      `;
            const hospitalValues = [
                hospital_name,
                hospital_code,
                hospital_type || 'Private',
                headquarters_address,
                contact_number,
                email,
                established_date || new Date(),
                total_beds || 0,
                req.file ? req.file.path : null,
                parsedModules ? JSON.stringify(parsedModules) : null
            ];
            const hospitalResult = await client.query(hospitalQuery, hospitalValues);
            const newHospital = hospitalResult.rows[0];

            // 3. Create Main Branch
            const branchQuery = `
        INSERT INTO branches (hospital_id, branch_name, branch_code, address_line1, contact_number, is_active)
        VALUES ($1, $2, $3, $4, $5, true)
        RETURNING *
      `;
            // Assuming Main Branch name is Hospital Name + " Main"
            const branchName = `${hospital_name} Main Branch`;
            const branchCode = `${hospital_code}-MAIN`;
            const branchValues = [newHospital.hospital_id, branchName, branchCode, headquarters_address, contact_number];
            const branchResult = await client.query(branchQuery, branchValues);
            const newBranch = branchResult.rows[0];

            // 4. Get Client Admin Role ID
            // Assuming we have a method or hardcoded. Better to fetch.
            const roleResult = await client.query("SELECT role_id FROM roles WHERE role_code = 'CLIENT_ADMIN'");
            if (roleResult.rows.length === 0) throw new AppError('Client Admin role not found', 500);
            const roleId = roleResult.rows[0].role_id;

            // 5. Create Client Admin User
            const passwordHash = await PasswordUtils.hashPassword(admin_password);
            const userQuery = `
        INSERT INTO users (username, email, phone_number, password_hash, role_id, is_active, is_email_verified)
        VALUES ($1, $2, $3, $4, $5, true, true)
        RETURNING user_id, username, email, role_id
      `;
            const userValues = [admin_username, admin_email, admin_phone, passwordHash, roleId];
            const userResult = await client.query(userQuery, userValues);
            const newUser = userResult.rows[0];

            // 6. Link User to Hospital/Branch? 
            // The schema might not have a direct link in 'users' table based on previous view.
            // Usually, there's a 'staff' table or similar. 
            // Let's check if we need to create a Staff record for this admin.
            // For now, assuming the User is enough, but typically we'd want to know WHICH hospital this admin belongs to.
            // If 'users' doesn't have hospital_id, we might need a mapping or put it in 'staff'.
            // Let's assume we create a Staff record for the admin to link them to the hospital.

            const staffCode = 'STF' + Date.now().toString().slice(-6);
            const staffQuery = `
        INSERT INTO staff (user_id, first_name, last_name, staff_code, staff_type, is_active)
        VALUES ($1, $2, $3, $4, 'ADMIN', true)
        RETURNING *
      `;
            // Split admin_name for first/last
            const nameToSplit = admin_name || admin_username || 'Admin';
            const nameParts = nameToSplit.split(' ');
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(' ') || '';

            const staffValues = [newUser.user_id, firstName, lastName, staffCode];
            const staffResult = await client.query(staffQuery, staffValues);
            const newStaff = staffResult.rows[0];

            // 7. Link Staff to Branch
            const staffBranchQuery = `
                INSERT INTO staff_branches (staff_id, branch_id, employment_type, is_active)
                VALUES ($1, $2, 'Permanent', true)
            `;
            await client.query(staffBranchQuery, [newStaff.staff_id, newBranch.branch_id]);

            // 8. Link Departments and Services to Main Branch if provided
            const { department_ids, service_ids } = req.body;

            if (department_ids && department_ids.length > 0) {
                for (const deptId of department_ids) {
                    await client.query(
                        'INSERT INTO branch_departments (branch_id, department_id, is_operational) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                        [newBranch.branch_id, deptId]
                    );
                }
            }

            if (service_ids && service_ids.length > 0) {
                for (const svcId of service_ids) {
                    await client.query(
                        'INSERT INTO branch_services (branch_id, service_id, is_active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                        [newBranch.branch_id, svcId]
                    );
                }
            }

            await client.query('COMMIT');

            res.status(201).json({
                status: 'success',
                message: 'Hospital, Main Branch, and Client Admin created successfully',
                data: {
                    hospital: newHospital,
                    main_branch: newBranch,
                    admin: newUser
                }
            });

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Create Hospital Error:', error);
            next(error instanceof AppError ? error : new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }

    /**
     * Get All Hospitals
     * Accessible by: SUPER_ADMIN
     */
    static async getAllHospitals(req, res, next) {
        try {
            const hospitals = await Hospital.findAll();
            res.status(200).json({
                status: 'success',
                results: hospitals.length,
                data: { hospitals }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get Hospital by ID
     * Accessible by: SUPER_ADMIN, CLIENT_ADMIN
     */
    static async getHospitalById(req, res, next) {
        try {
            const { id } = req.params;
            const hospital = await Hospital.findById(id);
            if (!hospital) return next(new AppError('Hospital not found', 404));
            res.status(200).json({ status: 'success', data: { hospital } });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update Hospital
     * Accessible by: SUPER_ADMIN, CLIENT_ADMIN (own hospital only)
     */
    static async updateHospital(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Sanitize integer fields - convert empty strings to null
            if (updates.total_beds === '' || updates.total_beds === undefined) {
                updates.total_beds = null;
            } else if (updates.total_beds !== null) {
                updates.total_beds = parseInt(updates.total_beds);
            }

            // Parse and stringify enabled_modules for PostgreSQL JSON field
            if (updates.enabled_modules) {
                if (typeof updates.enabled_modules === 'string') {
                    try {
                        updates.enabled_modules = JSON.parse(updates.enabled_modules);
                    } catch (e) {
                        updates.enabled_modules = [];
                    }
                }
                // Normalize
                if (Array.isArray(updates.enabled_modules)) {
                    updates.enabled_modules = updates.enabled_modules.map(m => {
                        if (typeof m === 'string') return { id: m, is_active: true };
                        return m;
                    });
                }
                // Stringify for PostgreSQL
                updates.enabled_modules = JSON.stringify(updates.enabled_modules);
            }

            // Handle logo_url from file upload
            if (req.file) {
                updates.logo_url = req.file.path;
            }

            // If CLIENT_ADMIN, ensure they are updating their own hospital
            if (req.userRole === 'CLIENT_ADMIN') {
                if (!req.user.hospital_id || req.user.hospital_id !== parseInt(id)) {
                    return next(new AppError('You can only update your own hospital', 403));
                }
            }

            const updatedHospital = await Hospital.update(id, updates);

            if (!updatedHospital) {
                return next(new AppError('Hospital not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Hospital updated successfully',
                data: { hospital: updatedHospital }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Toggle Hospital Status (Activate/Deactivate)
     * If deactivating hospital, cascade to all its branches
     * Accessible by: SUPER_ADMIN
     */
    static async toggleHospitalStatus(req, res, next) {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const { id } = req.params;
            const { is_active } = req.body;

            // Update hospital status
            const hospitalQuery = `
                UPDATE hospitals 
                SET is_active = $1, updated_at = NOW() 
                WHERE hospital_id = $2 
                RETURNING *
            `;
            const hospitalResult = await client.query(hospitalQuery, [is_active, id]);

            if (hospitalResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return next(new AppError('Hospital not found', 404));
            }

            const hospital = hospitalResult.rows[0];

            // If deactivating hospital, deactivate all its branches
            if (!is_active) {
                const branchesQuery = `
                    UPDATE branches 
                    SET is_active = false, updated_at = NOW() 
                    WHERE hospital_id = $1
                `;
                await client.query(branchesQuery, [id]);
            }

            await client.query('COMMIT');

            res.status(200).json({
                status: 'success',
                message: `Hospital ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: { hospital }
            });
        } catch (error) {
            await client.query('ROLLBACK');
            next(new AppError(error.message, 500));
        } finally {
            client.release();
        }
    }
}

module.exports = HospitalController;
