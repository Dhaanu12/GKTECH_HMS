const ClinicalNotes = require('../models/ClinicalNotes');
const { AppError } = require('../middleware/errorHandler');

/**
 * Clinical Notes Controller
 * Handles clinical notes CRUD operations
 */
class ClinicalNotesController {
    /**
     * Create a new clinical note
     * POST /api/clinical-notes
     */
    static async createNote(req, res, next) {
        try {
            const {
                patient_id,
                opd_id,
                note_type,
                title,
                content,
                diagnosis_codes,
                is_confidential,
                is_pinned
            } = req.body;

            if (!patient_id) {
                return next(new AppError('patient_id is required', 400));
            }

            if (!content || content.trim() === '') {
                return next(new AppError('Note content is required', 400));
            }

            const branch_id = req.user?.branch_id;
            if (!branch_id) {
                return next(new AppError('Branch not found for user', 400));
            }

            const noteData = {
                patient_id,
                opd_id: opd_id || null,
                branch_id,
                note_type: note_type || 'General',
                title,
                content,
                diagnosis_codes,
                is_confidential: is_confidential || false,
                is_pinned: is_pinned || false,
                created_by: req.userId
            };

            const note = await ClinicalNotes.createNote(noteData);

            res.status(201).json({
                status: 'success',
                message: 'Clinical note created successfully',
                data: { note }
            });
        } catch (error) {
            console.error('Create clinical note error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get notes for a patient
     * GET /api/clinical-notes/patient/:patientId
     * Query params: limit, offset, noteType, opdId, startDate, endDate
     */
    static async getPatientNotes(req, res, next) {
        try {
            const { patientId } = req.params;
            const { limit, offset, noteType, opdId, startDate, endDate } = req.query;

            const notes = await ClinicalNotes.getPatientNotes(patientId, {
                limit: limit ? parseInt(limit) : 50,
                offset: offset ? parseInt(offset) : 0,
                noteType,
                opdId: opdId ? parseInt(opdId) : null,
                startDate,
                endDate
            });

            const count = await ClinicalNotes.getNotesCount(patientId);

            res.status(200).json({
                status: 'success',
                data: {
                    notes,
                    total: count,
                    limit: limit ? parseInt(limit) : 50,
                    offset: offset ? parseInt(offset) : 0
                }
            });
        } catch (error) {
            console.error('Get patient notes error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get a single note by ID
     * GET /api/clinical-notes/:noteId
     */
    static async getNoteById(req, res, next) {
        try {
            const { noteId } = req.params;
            const note = await ClinicalNotes.getNoteById(noteId);

            if (!note) {
                return next(new AppError('Note not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { note }
            });
        } catch (error) {
            console.error('Get note error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Update a clinical note
     * PATCH /api/clinical-notes/:noteId
     */
    static async updateNote(req, res, next) {
        try {
            const { noteId } = req.params;
            const { note_type, title, content, is_confidential, is_pinned } = req.body;

            const note = await ClinicalNotes.updateNote(
                noteId,
                { note_type, title, content, is_confidential, is_pinned },
                req.userId
            );

            if (!note) {
                return next(new AppError('Note not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Note updated successfully',
                data: { note }
            });
        } catch (error) {
            console.error('Update note error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Delete a clinical note (soft delete)
     * DELETE /api/clinical-notes/:noteId
     */
    static async deleteNote(req, res, next) {
        try {
            const { noteId } = req.params;
            const deleted = await ClinicalNotes.deleteNote(noteId, req.userId);

            if (!deleted) {
                return next(new AppError('Note not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: 'Note deleted successfully'
            });
        } catch (error) {
            console.error('Delete note error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Toggle pin status
     * PATCH /api/clinical-notes/:noteId/pin
     */
    static async togglePin(req, res, next) {
        try {
            const { noteId } = req.params;
            const note = await ClinicalNotes.togglePin(noteId);

            if (!note) {
                return next(new AppError('Note not found', 404));
            }

            res.status(200).json({
                status: 'success',
                message: note.is_pinned ? 'Note pinned' : 'Note unpinned',
                data: { note }
            });
        } catch (error) {
            console.error('Toggle pin error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get notes for an OPD visit
     * GET /api/clinical-notes/opd/:opdId
     */
    static async getOpdNotes(req, res, next) {
        try {
            const { opdId } = req.params;
            const notes = await ClinicalNotes.getOpdNotes(opdId);

            res.status(200).json({
                status: 'success',
                data: { notes }
            });
        } catch (error) {
            console.error('Get OPD notes error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Search notes
     * GET /api/clinical-notes/patient/:patientId/search
     */
    static async searchNotes(req, res, next) {
        try {
            const { patientId } = req.params;
            const { q } = req.query;

            if (!q || q.trim() === '') {
                return next(new AppError('Search query is required', 400));
            }

            const notes = await ClinicalNotes.searchNotes(patientId, q);

            res.status(200).json({
                status: 'success',
                data: { notes }
            });
        } catch (error) {
            console.error('Search notes error:', error);
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = ClinicalNotesController;
