const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/patients/my-patients - Get doctor's patients
router.get('/my-patients', authorize('DOCTOR'), patientController.getMyPatients);

// GET /api/patients/search - Search patients (Accessible to Receptionist, Doctor, Nurse)
router.get('/search', authorize('RECEPTIONIST', 'DOCTOR', 'NURSE', 'CLIENT_ADMIN'), patientController.searchPatients);

// GET /api/patients - Get all patients (Receptionist only)
router.get('/', authorize('RECEPTIONIST'), patientController.getAllPatients);

// GET /api/patients/:id - Get patient details
router.get('/:id', authorize('RECEPTIONIST', 'DOCTOR', 'NURSE', 'CLIENT_ADMIN'), patientController.getPatientById);

// POST /api/patients - Create new patient (Receptionist only)
router.post('/', authorize('RECEPTIONIST'), patientController.createPatient);

// PATCH /api/patients/:id - Update patient details
router.patch('/:id', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN'), patientController.updatePatient);

module.exports = router;
