const express = require('express');
const router = express.Router();
const LabOrderController = require('../controllers/labOrderController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Lab Order Routes
 * Manages lab tests and examinations ordered by doctors
 */

// Get all lab orders for the user's branch (with filters)
// GET /api/lab-orders?status=Ordered&priority=STAT&category=Lab&date=2024-01-15
router.get('/', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.getOrders
);

// Get a single lab order by ID
// GET /api/lab-orders/:id
router.get('/:id', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.getOrderById
);

// Get lab orders for a specific patient
// GET /api/lab-orders/patient/:patientId
router.get('/patient/:patientId', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN', 'RECEPTIONIST'),
    LabOrderController.getOrdersByPatient
);

// Create a new lab order (Doctor only - for future integration)
// POST /api/lab-orders
router.post('/', 
    authenticate, 
    authorize('DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.createOrder
);

// Update lab order status
// PATCH /api/lab-orders/:id/status
router.patch('/:id/status', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.updateStatus
);

// Assign nurse to lab order
// PATCH /api/lab-orders/:id/assign
router.patch('/:id/assign', 
    authenticate, 
    authorize('NURSE', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.assignNurse
);

// Update lab order details
// PATCH /api/lab-orders/:id
router.patch('/:id', 
    authenticate, 
    authorize('DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.updateOrder
);

// Update result summary
// PATCH /api/lab-orders/:id/result
router.patch('/:id/result', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    LabOrderController.updateResult
);

module.exports = router;
