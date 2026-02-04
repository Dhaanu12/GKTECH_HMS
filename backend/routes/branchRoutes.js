const express = require('express');
const router = express.Router();
const BranchController = require('../controllers/branchController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BranchController.createBranch);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BranchController.updateBranch);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BranchController.toggleBranchStatus);
router.get('/hospital/:hospitalId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT_MANAGER', 'ACCOUNTANT'), BranchController.getBranchesByHospital);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BranchController.getAllBranches);
router.get('/:id/departments', authenticate, BranchController.getBranchDepartments);
router.get('/:id/services', authenticate, BranchController.getBranchServices);
router.get('/:id', authenticate, BranchController.getBranchById);

module.exports = router;
