const express = require('express');
const router = express.Router();
const ClinicalNotesController = require('../controllers/clinicalNotesController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/clinical-notes
 * Create a new clinical note
 * Roles: NURSE, DOCTOR, RECEPTIONIST
 */
router.post('/',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    ClinicalNotesController.createNote
);

/**
 * GET /api/clinical-notes/patient/:patientId
 * Get notes for a patient
 * Query params: limit, offset, noteType
 */
router.get('/patient/:patientId',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    ClinicalNotesController.getPatientNotes
);

/**
 * GET /api/clinical-notes/patient/:patientId/search
 * Search notes for a patient
 * Query params: q (search term)
 */
router.get('/patient/:patientId/search',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    ClinicalNotesController.searchNotes
);

/**
 * GET /api/clinical-notes/opd/:opdId
 * Get notes for an OPD visit
 */
router.get('/opd/:opdId',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    ClinicalNotesController.getOpdNotes
);

/**
 * GET /api/clinical-notes/:noteId
 * Get a single note by ID
 */
router.get('/:noteId',
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN'),
    ClinicalNotesController.getNoteById
);

/**
 * PATCH /api/clinical-notes/:noteId
 * Update a clinical note
 */
router.patch('/:noteId',
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN'),
    ClinicalNotesController.updateNote
);

/**
 * PATCH /api/clinical-notes/:noteId/pin
 * Toggle pin status
 */
router.patch('/:noteId/pin',
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN'),
    ClinicalNotesController.togglePin
);

/**
 * DELETE /api/clinical-notes/:noteId
 * Delete a clinical note (soft delete)
 */
router.delete('/:noteId',
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN'),
    ClinicalNotesController.deleteNote
);

module.exports = router;
