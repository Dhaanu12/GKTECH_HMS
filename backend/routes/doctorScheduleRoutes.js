const express = require('express');
const router = express.Router();
const doctorScheduleController = require('../controllers/doctorScheduleController');
const { authenticate: protect, authorize: restrictTo } = require('../middleware/auth');

// Public or Protected routes depending on requirements
// Assuming Receptionist and Admin needs access
router.use(protect);

router.get('/', doctorScheduleController.getAllSchedules);
router.post('/', restrictTo('CLIENT_ADMIN', 'ADMIN', 'SUPER_ADMIN'), doctorScheduleController.createSchedule);
router.get('/doctor/:doctor_id/:branch_id', doctorScheduleController.getDoctorSchedule);
router.get('/available', doctorScheduleController.getAvailableDoctorsByDate);
router.delete('/:schedule_id', restrictTo('CLIENT_ADMIN', 'ADMIN', 'SUPER_ADMIN'), doctorScheduleController.deleteSchedule);

module.exports = router;
