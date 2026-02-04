const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctorController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = require('../middleware/uploadMiddleware');

router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('signature'), DoctorController.createDoctor);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('signature'), DoctorController.updateDoctor);

// Get doctors for receptionist's branch
router.get('/my-branch', authenticate, authorize('RECEPTIONIST'), DoctorController.getMyBranchDoctors);

// New Route for Combined Schedule
// Using authenticate (protect) and authorize (restrictTo)
router.get('/schedule', authenticate, authorize('DOCTOR'), DoctorController.getDoctorSchedule);

// Get analytics for logged-in doctor
router.get('/analytics', authenticate, authorize('DOCTOR'), DoctorController.getAnalytics);

// Get dashboard statistics
router.get('/dashboard-stats', authenticate, authorize('DOCTOR'), DoctorController.getDashboardStats);

router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), DoctorController.getAllDoctors);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), DoctorController.getDoctorById);
router.post('/:id/departments', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), DoctorController.assignDepartment);
router.get('/:id/branches', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), DoctorController.getDoctorBranches);

module.exports = router;
