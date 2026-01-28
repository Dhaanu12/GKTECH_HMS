const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/admin/stats - Get dashboard stats (Super Admin only)
router.get('/stats', authorize('SUPER_ADMIN'), adminController.getDashboardStats);

module.exports = router;
