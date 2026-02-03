const express = require('express');
const router = express.Router();
const MedicalServicesController = require('../controllers/MedicalServicesController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all services with pagination and filtering
router.get('/', authenticate, MedicalServicesController.getAllServices);

// Get service categories
router.get('/categories', authenticate, MedicalServicesController.getCategories);

// Hospital services
router.get('/hospital/:hospitalId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.getHospitalServices);
router.post('/hospital/:hospitalId/assign', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.assignHospitalServices);

// Branch services
router.get('/branch/:branchId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.getBranchServices);
router.post('/branch/:branchId/assign', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.assignBranchServices);

module.exports = router;
