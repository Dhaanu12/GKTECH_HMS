const express = require('express');
const router = express.Router();
const clientAdminController = require('../controllers/clientAdminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/clientadmins - Get all client admins (Super Admin only)
router.get('/', authorize('SUPER_ADMIN'), clientAdminController.getAllClientAdmins);

// GET /api/clientadmins/my-hospital - Get client admins for logged-in Client Admin's hospital
router.get('/my-hospital', authorize('CLIENT_ADMIN'), clientAdminController.getMyHospitalClientAdmins);

// GET /api/clientadmins/stats - Get dashboard stats for logged-in Client Admin
router.get('/stats', authorize('CLIENT_ADMIN'), clientAdminController.getDashboardStats);

// GET /api/clientadmins/analytics - Get comprehensive analytics for logged-in Client Admin
router.get('/analytics', authorize('CLIENT_ADMIN', 'RECEPTIONIST'), clientAdminController.getAnalytics);

// GET /api/clientadmins/:id - Get client admin by ID
router.get('/:id', authorize('SUPER_ADMIN'), clientAdminController.getClientAdminById);

// POST /api/clientadmins - Create new client admin
router.post('/', authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), clientAdminController.createClientAdmin);

// PUT /api/clientadmins/:id - Update client admin
router.put('/:id', authorize('SUPER_ADMIN'), clientAdminController.updateClientAdmin);

// DELETE /api/clientadmins/:id - Delete client admin
router.delete('/:id', authorize('SUPER_ADMIN'), clientAdminController.deleteClientAdmin);

module.exports = router;
