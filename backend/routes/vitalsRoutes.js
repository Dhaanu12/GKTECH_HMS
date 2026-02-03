const express = require('express');
const router = express.Router();
const VitalsController = require('../controllers/vitalsController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/vitals
 * Record new vital signs
 * Roles: NURSE, DOCTOR, RECEPTIONIST
 */
router.post('/',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    VitalsController.recordVitals
);

/**
 * GET /api/vitals/patient/:patientId
 * Get vitals history for a patient
 * Query params: limit, offset, startDate, endDate
 */
router.get('/patient/:patientId',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    VitalsController.getPatientVitals
);

/**
 * GET /api/vitals/patient/:patientId/latest
 * Get latest vitals for a patient
 */
router.get('/patient/:patientId/latest',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    VitalsController.getLatestVitals
);

/**
 * GET /api/vitals/patient/:patientId/stats
 * Get vitals statistics/trends for a patient
 * Query params: days (default 30)
 */
router.get('/patient/:patientId/stats',
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN'),
    VitalsController.getVitalsStats
);

/**
 * GET /api/vitals/opd/:opdId
 * Get vitals for an OPD visit
 */
router.get('/opd/:opdId',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    VitalsController.getOpdVitals
);

/**
 * DELETE /api/vitals/:vitalId
 * Delete a vitals record
 * Roles: NURSE, DOCTOR, CLIENT_ADMIN (limited - should only delete own records)
 */
router.delete('/:vitalId',
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN'),
    VitalsController.deleteVitals
);

module.exports = router;
