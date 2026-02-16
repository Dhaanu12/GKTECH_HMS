const Branch = require('../models/Branch');
const { AppError } = require('../middleware/errorHandler');

class BranchController {
    /**
     * Create a new Branch
     * Accessible by: SUPER_ADMIN, CLIENT_ADMIN
     */
    static async createBranch(req, res, next) {
        try {
            const {
                hospital_id, branch_name, branch_code,
                address_line1, city, state, pincode, contact_number,
                emergency_available, mlc_fee
            } = req.body;

            // If CLIENT_ADMIN, force hospital_id from their profile
            let targetHospitalId = hospital_id;
            if (req.userRole === 'CLIENT_ADMIN') {
                if (!req.user.hospital_id) {
                    return next(new AppError('You are not linked to any hospital', 403));
                }
                targetHospitalId = req.user.hospital_id;
            }

            const newBranch = await Branch.create({
                hospital_id: targetHospitalId,
                branch_name,
                branch_code,
                address_line1,
                city,
                state,
                pincode,
                contact_number,
                emergency_available: emergency_available || false,
                mlc_fee: mlc_fee || 0,
                is_active: true,
                enabled_modules: (() => {
                    let em = req.body.enabled_modules;
                    if (typeof em === 'string') {
                        try { em = JSON.parse(em); } catch (e) { em = null; }
                    }
                    if (Array.isArray(em)) {
                        const processedModules = em.map(m => {
                            if (typeof m === 'string') return { id: m, is_active: true };
                            return m;
                        });
                        return JSON.stringify(processedModules);
                    }
                    return null; // Default to null (Inherit)
                })()
            });

            // Insert Mappings if provided
            const { department_ids, service_ids } = req.body;
            const { pool } = require('../config/db'); // Ensure pool access

            if (department_ids && department_ids.length > 0) {
                for (const deptId of department_ids) {
                    await pool.query(
                        'INSERT INTO branch_departments (branch_id, department_id, is_operational) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                        [newBranch.branch_id, deptId]
                    );
                }
            }

            if (service_ids && service_ids.length > 0) {
                for (const svcId of service_ids) {
                    await pool.query(
                        'INSERT INTO branch_services (branch_id, service_id, is_active) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
                        [newBranch.branch_id, svcId]
                    );
                }
            }

            res.status(201).json({
                status: 'success',
                message: 'Branch created successfully',
                data: { branch: newBranch }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update Branch
     */
    static async updateBranch(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Extract only allowed fields
            const allowedUpdates = {};
            const allowedFields = [
                'branch_name', 'branch_code', 'address_line1',
                'city', 'state', 'pincode', 'contact_number',
                'emergency_available', 'mlc_fee', 'is_active',
                'enabled_modules',
                'consultation_rooms', 'daycare_available', 'daycare_beds', 'clinic_schedule'
            ];

            allowedFields.forEach(field => {
                if (updates[field] !== undefined) {
                    allowedUpdates[field] = updates[field];
                }
            });

            // Parse enabled_modules if present
            if (allowedUpdates.enabled_modules) {
                if (typeof allowedUpdates.enabled_modules === 'string') {
                    try {
                        allowedUpdates.enabled_modules = JSON.parse(allowedUpdates.enabled_modules);
                    } catch (e) {
                        allowedUpdates.enabled_modules = [];
                    }
                }
                // Normalize to object structure
                if (Array.isArray(allowedUpdates.enabled_modules)) {
                    allowedUpdates.enabled_modules = allowedUpdates.enabled_modules.map(m => {
                        if (typeof m === 'string') return { id: m, is_active: true };
                        return m;
                    });
                    allowedUpdates.enabled_modules = JSON.stringify(allowedUpdates.enabled_modules);
                }
            }

            const updatedBranch = await Branch.update(id, allowedUpdates);

            if (!updatedBranch) {
                return next(new AppError('Branch not found', 404));
            }

            // Update Mappings if provided
            const { department_ids, service_ids } = req.body;
            const { pool } = require('../config/db');

            // Update Departments
            if (department_ids !== undefined) {
                await pool.query(
                    'UPDATE branch_departments SET is_operational = false WHERE branch_id = $1',
                    [id]
                );

                if (department_ids.length > 0) {
                    for (const deptId of department_ids) {
                        await pool.query(
                            `INSERT INTO branch_departments (branch_id, department_id, is_operational)
                              VALUES ($1, $2, true)
                              ON CONFLICT (branch_id, department_id)
                              DO UPDATE SET is_operational = true`,
                            [id, deptId]
                        );
                    }
                }
            }

            // Update Services
            if (service_ids !== undefined) {
                await pool.query(
                    'UPDATE branch_services SET is_active = false WHERE branch_id = $1',
                    [id]
                );

                if (service_ids.length > 0) {
                    for (const svcId of service_ids) {
                        await pool.query(
                            `INSERT INTO branch_services (branch_id, service_id, is_active)
                              VALUES ($1, $2, true)
                              ON CONFLICT (branch_id, service_id)
                              DO UPDATE SET is_active = true`,
                            [id, svcId]
                        );
                    }
                }
            }

            res.status(200).json({
                status: 'success',
                data: { branch: updatedBranch }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    /**
     * Get Branches by Hospital
     */
    static async getBranchesByHospital(req, res, next) {
        try {
            const { hospitalId } = req.params;
            const branches = await Branch.findByHospital(hospitalId);

            res.status(200).json({
                status: 'success',
                results: branches.length,
                data: { branches }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get All Branches (Super Admin)
     */
    /**
     * Get All Branches (Super Admin / Client Admin)
     */
    static async getAllBranches(req, res, next) {
        try {
            const { search } = req.query;
            let branches = [];

            // Filter by hospital if Client Admin
            const filter = {};
            if (req.userRole === 'CLIENT_ADMIN') {
                if (!req.user.hospital_id) {
                    return next(new AppError('You are not linked to any hospital', 403));
                }
                filter.hospital_id = req.user.hospital_id;
            }

            if (search) {
                // If search is used, we need to ensure we still filter by hospital_id for Client Admin
                // The current Branch.search() likely searches global if not modified.
                // For now, let's use findAll with stricter filters or update search to accept filters.
                // Assuming Branch.findAll supports partial match if we implemented it, but Branch.search uses raw query.
                // Let's check Branch.search implementation. It joins hospitals but arguments are just searchTerm.
                // To be safe and quick: fetch all for hospital then filter in memory OR 
                // preferably, update Branch model. But let's look at Branch.findAll capabilities.
                // Branch.findAll takes simple object.

                // If Client Admin, we MUST scope by hospital_id. 
                // Branch.search doesn't support hospitalId param currently.
                // Let's modify Branch.search or use a raw query here, or just stick to findAll if search is not heavily used yet relative to security.

                // Actually, let's just use findAll with the filter we built.
                // If search is present, we might need to do manual filtering or update model.
                // Given the risk, let's default to preventing search leak:
                if (req.userRole === 'CLIENT_ADMIN') {
                    // Start with hospital filter
                    const allHospitalBranches = await Branch.findAll({ hospital_id: req.user.hospital_id });
                    if (search) {
                        const lowerSearch = search.toLowerCase();
                        branches = allHospitalBranches.filter(b =>
                            b.branch_name.toLowerCase().includes(lowerSearch) ||
                            b.branch_code.toLowerCase().includes(lowerSearch)
                        );
                    } else {
                        branches = allHospitalBranches;
                    }
                } else {
                    // Super Admin - existing logic
                    if (search) {
                        branches = await Branch.search(search);
                    } else {
                        branches = await Branch.findAll({}, { orderBy: 'branch_name ASC' });
                    }
                }
            } else {
                branches = await Branch.findAll(filter, { orderBy: 'branch_name ASC' });
            }

            res.status(200).json({
                status: 'success',
                results: branches.length,
                data: { branches }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Toggle Branch Status (Activate/Deactivate)
     * Accessible by: SUPER_ADMIN, CLIENT_ADMIN
     */
    static async toggleBranchStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;

            const { pool } = require('../config/db');
            const query = `
                UPDATE branches 
                SET is_active = $1, updated_at = NOW() 
                WHERE branch_id = $2 
                RETURNING *
            `;
            const result = await pool.query(query, [is_active, id]);

            if (result.rows.length === 0) {
                return next(new AppError('Branch not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: `Branch ${is_active ? 'activated' : 'deactivated'} successfully`,
                data: { branch: result.rows[0] }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    /**
     * Get Branch by ID
     */
    static async getBranchById(req, res, next) {
        try {
            const { id } = req.params;
            const branch = await Branch.findById(id);

            if (!branch) {
                return next(new AppError('Branch not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { branch }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
    /**
     * Get Departments by Branch ID
     */
    static async getBranchDepartments(req, res, next) {
        try {
            const { id } = req.params;
            const BranchDepartment = require('../models/BranchDepartment');
            const departments = await BranchDepartment.findByBranch(id);

            res.status(200).json({
                status: 'success',
                results: departments.length,
                data: { departments }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get Services by Branch ID
     */
    static async getBranchServices(req, res, next) {
        try {
            const { id } = req.params;
            const BranchService = require('../models/BranchService');
            const services = await BranchService.findByBranch(id);

            res.status(200).json({
                status: 'success',
                results: services.length,
                data: { services }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = BranchController;
