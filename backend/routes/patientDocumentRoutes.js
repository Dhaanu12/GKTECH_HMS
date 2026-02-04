const express = require('express');
const router = express.Router();
const multer = require('multer');
const PatientDocumentController = require('../controllers/patientDocumentController');
const { authenticate, authorize } = require('../middleware/auth');

/**
 * Patient Document Routes
 * Manages secure document upload and retrieval
 */

// Configure multer for memory storage (we'll store in DB)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 20 * 1024 * 1024 // 20 MB limit
    },
    fileFilter: (req, file, cb) => {
        // Allow images and PDFs
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/tiff',
            'application/pdf',
            'application/dicom'
        ];
        
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`File type ${file.mimetype} is not allowed`), false);
        }
    }
});

// Upload a new document
// POST /api/patient-documents
router.post('/', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    upload.single('file'),
    PatientDocumentController.uploadDocument
);

// Get all documents for a patient
// GET /api/patient-documents/patient/:patientId
router.get('/patient/:patientId', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.getPatientDocuments
);

// Get documents for a lab order
// GET /api/patient-documents/lab-order/:labOrderId
router.get('/lab-order/:labOrderId', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.getLabOrderDocuments
);

// Get document metadata
// GET /api/patient-documents/:id
router.get('/:id', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.getDocumentMetadata
);

// Download document (returns file)
// GET /api/patient-documents/:id/download
router.get('/:id/download', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.downloadDocument
);

// View document inline
// GET /api/patient-documents/:id/view
router.get('/:id/view', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'RECEPTIONIST', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.viewDocument
);

// Get access logs for a document (admin only)
// GET /api/patient-documents/:id/logs
router.get('/:id/logs', 
    authenticate, 
    authorize('CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.getDocumentLogs
);

// Delete document (soft delete, or hard delete for admins with ?hard=true)
// DELETE /api/patient-documents/:id
router.delete('/:id', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.deleteDocument
);

// Restore a soft-deleted document
// POST /api/patient-documents/:id/restore
router.post('/:id/restore', 
    authenticate, 
    authorize('NURSE', 'DOCTOR', 'CLIENT_ADMIN', 'SUPER_ADMIN'),
    PatientDocumentController.restoreDocument
);

module.exports = router;
