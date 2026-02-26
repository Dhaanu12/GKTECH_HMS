const express = require('express');
const router = express.Router();
const NurseController = require('../controllers/nurseController');
const { authenticate, authorize, requireModule } = require('../middleware/auth');

router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), requireModule('nurse'), NurseController.createNurse);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), requireModule('nurse'), NurseController.updateNurse);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), NurseController.getAllNurses);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), NurseController.getNurseById);
router.post('/:id/departments', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), NurseController.assignDepartment);
router.get('/:id/branches', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), NurseController.getNurseBranches);

module.exports = router;
