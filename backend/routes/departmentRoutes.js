const express = require('express');
const router = express.Router();
const DepartmentController = require('../controllers/departmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all departments (accessible by all authenticated users)
router.get('/', authenticate, DepartmentController.getAllDepartments);

// Get active departments only
router.get('/active', authenticate, DepartmentController.getActiveDepartments);

// Get department by ID
router.get('/:id', authenticate, DepartmentController.getDepartmentById);

// Create department (SUPER_ADMIN only)
router.post('/', authenticate, authorize('SUPER_ADMIN'), DepartmentController.createDepartment);

// Update department (SUPER_ADMIN only)
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), DepartmentController.updateDepartment);

module.exports = router;
