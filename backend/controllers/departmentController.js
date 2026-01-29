const Department = require('../models/Department');
const { AppError } = require('../middleware/errorHandler');

class DepartmentController {
    /**
     * Get All Departments
     * Accessible by: All authenticated users
     */
    static async getAllDepartments(req, res, next) {
        try {
            const departments = await Department.findAll();
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
     * Get Active Departments Only
     * Accessible by: All authenticated users
     */
    static async getActiveDepartments(req, res, next) {
        try {
            const departments = await Department.findActive();
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
     * Get Departments for Current Hospital
     * Accessible by: Authenticated users with hospital_id
     */
    static async getHospitalDepartments(req, res, next) {
        try {
            const hospitalId = req.query.hospital_id || req.user.hospital_id;

            if (!hospitalId) {
                // If no hospital_id found (e.g. Super Admin without query param), maybe return all or active?
                // Let's assume we want to return active departments as fallback or error?
                // For now, let's return active departments if no hospital context, 
                // but strictly speaking, the requirement is specific about hospital.
                // Assuming CLIENT_ADMIN/RECEPTIONIST always has hospital_id.
                // If SUPER_ADMIN, they should provide hospital_id in query if they want to filter, otherwise maybe all active.

                if (req.userRole === 'SUPER_ADMIN') {
                    const departments = await Department.findActive();
                    return res.status(200).json({
                        status: 'success',
                        results: departments.length,
                        data: { departments }
                    });
                } else {
                    return next(new AppError('Hospital ID not found in user context', 400));
                }
            }

            const departments = await Department.findByHospitalId(hospitalId);
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
     * Get Department by ID
     * Accessible by: All authenticated users
     */
    static async getDepartmentById(req, res, next) {
        try {
            const { id } = req.params;
            const department = await Department.findById(id);

            if (!department) {
                return next(new AppError('Department not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { department }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Create Department
     * Accessible by: SUPER_ADMIN only
     */
    static async createDepartment(req, res, next) {
        try {
            const { department_name, department_code, description } = req.body;

            const newDepartment = await Department.create({
                department_name,
                department_code,
                description,
                is_active: true
            });

            res.status(201).json({
                status: 'success',
                message: 'Department created successfully',
                data: { department: newDepartment }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update Department
     * Accessible by: SUPER_ADMIN only
     */
    static async updateDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            const updatedDepartment = await Department.update(id, updates);

            if (!updatedDepartment) {
                return next(new AppError('Department not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Department updated successfully',
                data: { department: updatedDepartment }
            });
        } catch (error) {
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = DepartmentController;
