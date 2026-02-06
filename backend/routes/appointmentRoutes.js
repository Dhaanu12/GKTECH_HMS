const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointmentController');
const { authenticate, authorize } = require('../middleware/auth');

// Create appointment
router.post('/', authenticate, authorize('RECEPTIONIST', 'CLIENT_ADMIN'), AppointmentController.createAppointment);

// Get appointments
router.get('/', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), AppointmentController.getAppointments);

// Check duplicate appointment (MUST be before /:id to avoid route conflict)
router.get('/check-duplicate', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), AppointmentController.checkDuplicate);

// Get appointment by ID
router.get('/:id', authenticate, authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), AppointmentController.getAppointmentById);

// Update appointment status
router.patch('/:id/status', authenticate, authorize('RECEPTIONIST', 'CLIENT_ADMIN'), AppointmentController.updateAppointmentStatus);

// Reschedule appointment
router.patch('/:id/reschedule', authenticate, authorize('RECEPTIONIST', 'CLIENT_ADMIN'), AppointmentController.rescheduleAppointment);

module.exports = router;

