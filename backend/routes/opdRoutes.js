const express = require('express');
const router = express.Router();
const opdController = require('../controllers/opdController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// Analytics Route - Accessible by Receptionist and Client Admin (and others if needed)
router.get('/stats/analytics', authorize('RECEPTIONIST', 'CLIENT_ADMIN', 'ADMIN', 'DOCTOR'), opdController.getAnalytics);

// GET /api/opd - Get OPD entries for branch
router.get('/', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN', 'NURSE'), opdController.getOpdEntries);

// GET /api/opd/stats - Get dashboard stats (Receptionist only)
router.get('/stats', authorize('RECEPTIONIST'), opdController.getDashboardStats);

// GET /api/opd/patient/:patientId - Get OPD history for a patient
router.get('/patient/:patientId', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN', 'NURSE'), opdController.getOpdHistoryByPatient);

// GET /api/opd/check-duplicate - Check for duplicate entry
router.get('/check-duplicate', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN', 'NURSE'), opdController.checkDuplicate);

// GET /api/opd/:id - Get OPD entry details
router.get('/:id', authorize('RECEPTIONIST', 'DOCTOR', 'CLIENT_ADMIN', 'NURSE'), opdController.getOpdEntryById);

// POST /api/opd - Create new OPD entry (Receptionist only)
router.post('/', authorize('RECEPTIONIST'), opdController.createOpdEntry);

// PATCH /api/opd/:id/payment - Update payment status (Receptionist only)
router.patch('/:id/payment', authorize('RECEPTIONIST'), opdController.updatePaymentStatus);

// PATCH /api/opd/:id/vitals - Update vitals only (Nurse, Doctor, Receptionist)
router.patch('/:id/vitals', authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'), opdController.updateVitals);

// PATCH /api/opd/:id - Update OPD entry (Receptionist only)
router.patch('/:id', authorize('RECEPTIONIST', 'NURSE'), opdController.updateOpdEntry);

// DELETE /api/opd/:id - Delete OPD entry (Receptionist only)
router.delete('/:id', authorize('RECEPTIONIST'), opdController.deleteOpdEntry);



module.exports = router;
