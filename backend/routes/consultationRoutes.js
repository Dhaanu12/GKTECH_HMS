const express = require('express');
const router = express.Router();
const ConsultationController = require('../controllers/consultationController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// Start consultation
router.post('/start', authorize('DOCTOR'), ConsultationController.startConsultation);

// Complete consultation
router.post('/complete', authorize('DOCTOR'), ConsultationController.completeConsultation);

// Save consultation draft
router.post('/draft', authorize('DOCTOR'), ConsultationController.saveDraft);

// Get consultation draft
router.get('/draft/:opdId', authorize('DOCTOR'), ConsultationController.getDraft);

// Get patient consultation history
router.get('/patient/:patientId', authorize('DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'), ConsultationController.getPatientConsultations);

module.exports = router;
