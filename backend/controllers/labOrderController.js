const LabOrder = require('../models/LabOrder');
const { AppError } = require('../middleware/errorHandler');

/**
 * Lab Order Controller
 * Handles lab test/examination order management
 */
class LabOrderController {
    /**
     * Create a new lab order
     * POST /api/lab-orders
     * Roles: DOCTOR
     */
    static async createOrder(req, res, next) {
        try {
            const {
                patient_id,
                test_name,
                test_code,
                test_category,
                priority,
                scheduled_for,
                instructions,
                notes,
                opd_id,
                prescription_id
            } = req.body;

            // Get doctor_id and branch_id from authenticated user
            const doctor_id = req.user?.doctor_id;
            const branch_id = req.user?.branch_id;

            if (!doctor_id) {
                return next(new AppError('Doctor ID not found in token', 400));
            }

            if (!patient_id || !test_name || !test_category) {
                return next(new AppError('patient_id, test_name, and test_category are required', 400));
            }

            const orderData = {
                patient_id,
                doctor_id,
                branch_id,
                test_name,
                test_code: test_code || null,
                test_category,
                priority: priority || 'Routine',
                scheduled_for: scheduled_for || null,
                instructions: instructions || null,
                notes: notes || null,
                opd_id: opd_id || null,
                prescription_id: prescription_id || null,
                status: 'Ordered'
            };

            const order = await LabOrder.create(orderData);

            res.status(201).json({
                status: 'success',
                message: 'Lab order created successfully',
                data: { order }
            });
        } catch (error) {
            console.error('Create lab order error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get all lab orders for a branch with filters
     * GET /api/lab-orders
     * Roles: NURSE, DOCTOR, CLIENT_ADMIN
     */
    static async getOrders(req, res, next) {
        try {
            const branch_id = req.user?.branch_id;
            const { status, priority, category, date, includeCompleted } = req.query;

            // If no branch_id (e.g., super admin), return all orders or require branch filter
            if (!branch_id) {
                // For now, return empty if no branch context
                return res.status(200).json({
                    status: 'success',
                    data: {
                        orders: [],
                        counts: { Ordered: 0, 'In-Progress': 0, Completed: 0, Cancelled: 0 },
                        total: 0,
                        message: 'No branch context available. Please select a branch.'
                    }
                });
            }

            const filters = {
                status: status || null,
                priority: priority || null,
                category: category || null,
                date: date || null,
                includeCompleted: includeCompleted === 'true'
            };

            const orders = await LabOrder.findByBranch(branch_id, filters);
            const counts = await LabOrder.getStatusCounts(branch_id);

            res.status(200).json({
                status: 'success',
                data: {
                    orders,
                    counts,
                    total: orders.length
                }
            });
        } catch (error) {
            console.error('Get lab orders error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get a single lab order by ID
     * GET /api/lab-orders/:id
     */
    static async getOrderById(req, res, next) {
        try {
            const { id } = req.params;
            const order = await LabOrder.findByIdWithDetails(id);

            if (!order) {
                return next(new AppError('Lab order not found', 404));
            }

            // Get status history
            const statusHistory = await LabOrder.getStatusHistory(id);

            res.status(200).json({
                status: 'success',
                data: {
                    order,
                    statusHistory
                }
            });
        } catch (error) {
            console.error('Get lab order error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get lab orders for a specific patient
     * GET /api/lab-orders/patient/:patientId
     */
    static async getOrdersByPatient(req, res, next) {
        try {
            const { patientId } = req.params;
            const { includeCompleted, opdId } = req.query;

            const orders = await LabOrder.findByPatient(patientId, {
                includeCompleted: includeCompleted === 'true',
                opdId: opdId ? parseInt(opdId) : null
            });

            res.status(200).json({
                status: 'success',
                data: { orders }
            });
        } catch (error) {
            console.error('Get patient lab orders error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update lab order status
     * PATCH /api/lab-orders/:id/status
     * Roles: NURSE, DOCTOR
     */
    static async updateStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status, notes } = req.body;
            const userId = req.userId;

            if (!status) {
                return next(new AppError('Status is required', 400));
            }

            const validStatuses = ['Ordered', 'In-Progress', 'Completed', 'Cancelled'];
            if (!validStatuses.includes(status)) {
                return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
            }

            const order = await LabOrder.updateStatus(id, status, userId, notes);

            res.status(200).json({
                status: 'success',
                message: 'Lab order status updated',
                data: { order }
            });
        } catch (error) {
            console.error('Update lab order status error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Assign nurse to lab order
     * PATCH /api/lab-orders/:id/assign
     * Roles: NURSE, CLIENT_ADMIN
     */
    static async assignNurse(req, res, next) {
        try {
            const { id } = req.params;
            const { nurse_id } = req.body;

            // If no nurse_id provided, use the current user's nurse_id
            const nurseId = nurse_id || req.user?.nurse_id;

            if (!nurseId) {
                return next(new AppError('Nurse ID is required', 400));
            }

            const order = await LabOrder.assignNurse(id, nurseId);

            if (!order) {
                return next(new AppError('Lab order not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Nurse assigned to lab order',
                data: { order }
            });
        } catch (error) {
            console.error('Assign nurse error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update lab order details
     * PATCH /api/lab-orders/:id
     * Roles: DOCTOR
     */
    static async updateOrder(req, res, next) {
        try {
            const { id } = req.params;
            const updates = req.body;

            // Don't allow status updates through this endpoint
            delete updates.status;
            delete updates.order_id;
            delete updates.order_number;

            const order = await LabOrder.update(id, updates);

            if (!order) {
                return next(new AppError('Lab order not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Lab order updated',
                data: { order }
            });
        } catch (error) {
            console.error('Update lab order error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update result summary for a completed order
     * PATCH /api/lab-orders/:id/result
     * Roles: NURSE, DOCTOR
     */
    static async updateResult(req, res, next) {
        try {
            const { id } = req.params;
            const { result_summary } = req.body;

            const order = await LabOrder.update(id, { result_summary });

            if (!order) {
                return next(new AppError('Lab order not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Result summary updated',
                data: { order }
            });
        } catch (error) {
            console.error('Update result error:', error);
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = LabOrderController;
