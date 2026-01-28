const express = require('express');
const router = express.Router();
const ShiftController = require('../controllers/shiftController');
const { authenticate, authorize } = require('../middleware/auth');

// Shift Management
router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), ShiftController.createShift);
router.get('/branch/:branchId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), ShiftController.getShiftsByBranch);

// Rostering (Assignment)
router.post('/assign/doctor', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), ShiftController.assignDoctorToShift);
router.post('/assign/nurse', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), ShiftController.assignNurseToShift);

module.exports = router;
