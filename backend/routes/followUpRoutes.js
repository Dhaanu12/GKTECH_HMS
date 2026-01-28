/**
 * Follow-up Routes
 * API endpoints for follow-up scheduling and tracking
 */

const express = require('express');
const router = express.Router();
const FollowUpController = require('../controllers/followUpController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Get due/overdue follow-ups (receptionist, doctor, admin)
router.get('/due', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), FollowUpController.getDueFollowUps);

// Get follow-up statistics for dashboard
router.get('/stats', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), FollowUpController.getFollowUpStats);

// Get follow-up status for a specific patient
router.get('/patient/:patientId', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), FollowUpController.getPatientFollowUpStatus);

module.exports = router;
