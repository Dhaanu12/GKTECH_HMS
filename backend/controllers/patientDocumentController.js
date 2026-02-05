const PatientDocument = require('../models/PatientDocument');
const DocumentAccessLog = require('../models/DocumentAccessLog');
const { encryptFile, decryptFile, calculateChecksum, verifyChecksum } = require('../utils/fileEncryption');
const { validateFile, generateStorageFileName, sanitizeFileName } = require('../utils/fileValidation');
const { AppError } = require('../middleware/errorHandler');

/**
 * Patient Document Controller
 * Handles secure document upload, retrieval, and management
 */
class PatientDocumentController {
    /**
     * Upload a new document
     * POST /api/patient-documents
     * Roles: NURSE, DOCTOR, RECEPTIONIST
     */
    static async uploadDocument(req, res, next) {
        try {
            const { patient_id, lab_order_id, document_type, description } = req.body;
            const userId = req.userId;
            const file = req.file;

            if (!file) {
                return next(new AppError('No file uploaded', 400));
            }

            if (!patient_id) {
                return next(new AppError('patient_id is required', 400));
            }

            if (!document_type) {
                return next(new AppError('document_type is required', 400));
            }

            // Validate file
            const validation = validateFile(file.buffer, file.mimetype, file.originalname);
            if (!validation.valid) {
                return next(new AppError(validation.error, 400));
            }

            // Calculate checksum before encryption
            const checksum = calculateChecksum(file.buffer);

            // Encrypt file
            const { encryptedData, iv } = encryptFile(file.buffer);

            // Generate storage file name
            const storageFileName = generateStorageFileName(file.originalname);

            // Create document record
            const documentData = {
                patient_id: parseInt(patient_id),
                lab_order_id: lab_order_id ? parseInt(lab_order_id) : null,
                document_type,
                file_name: storageFileName,
                original_file_name: sanitizeFileName(file.originalname),
                file_mime_type: validation.detectedType || file.mimetype,
                file_size: file.size,
                file_data: encryptedData,
                encryption_iv: iv,
                file_checksum: checksum,
                description: description || null,
                uploaded_by: userId
            };

            const document = await PatientDocument.create(documentData);

            // Log the upload
            await DocumentAccessLog.logUpload(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent'],
                { file_size: file.size, mime_type: file.mimetype }
            );

            // Return document without file_data
            const responseDoc = { ...document };
            delete responseDoc.file_data;
            delete responseDoc.encryption_iv;

            res.status(201).json({
                status: 'success',
                message: 'Document uploaded successfully',
                data: { document: responseDoc }
            });
        } catch (error) {
            console.error('Upload document error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get all documents for a patient
     * GET /api/patient-documents/patient/:patientId
     */
    static async getPatientDocuments(req, res, next) {
        try {
            const { patientId } = req.params;
            const { documentType, includeDeleted, opdId } = req.query;

            const documents = await PatientDocument.findByPatient(patientId, {
                documentType: documentType || null,
                includeDeleted: includeDeleted === 'true',
                opdId: opdId ? parseInt(opdId) : null
            });

            const typeCounts = await PatientDocument.getTypeCounts(patientId);

            res.status(200).json({
                status: 'success',
                data: { 
                    documents,
                    typeCounts,
                    total: documents.length
                }
            });
        } catch (error) {
            console.error('Get patient documents error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get documents for a lab order
     * GET /api/patient-documents/lab-order/:labOrderId
     */
    static async getLabOrderDocuments(req, res, next) {
        try {
            const { labOrderId } = req.params;

            const documents = await PatientDocument.findByLabOrder(labOrderId);

            res.status(200).json({
                status: 'success',
                data: { documents }
            });
        } catch (error) {
            console.error('Get lab order documents error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get document metadata (without file content)
     * GET /api/patient-documents/:id
     */
    static async getDocumentMetadata(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const document = await PatientDocument.getMetadata(id);

            if (!document) {
                return next(new AppError('Document not found', 404));
            }

            // Log the view
            await DocumentAccessLog.logView(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent']
            );

            // Get access stats
            const stats = await DocumentAccessLog.getDocumentStats(id);

            res.status(200).json({
                status: 'success',
                data: { 
                    document,
                    stats
                }
            });
        } catch (error) {
            console.error('Get document metadata error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Download document (returns decrypted file)
     * GET /api/patient-documents/:id/download
     */
    static async downloadDocument(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const document = await PatientDocument.getFileData(id);

            if (!document) {
                return next(new AppError('Document not found', 404));
            }

            if (document.is_deleted) {
                return next(new AppError('Document has been deleted', 410));
            }

            if (!document.file_data) {
                return next(new AppError('Document file data not available', 404));
            }

            // Decrypt file
            const decryptedData = decryptFile(document.file_data, document.encryption_iv);

            // Verify checksum
            if (!verifyChecksum(decryptedData, document.file_checksum)) {
                console.error('Checksum verification failed for document:', id);
                return next(new AppError('Document integrity check failed', 500));
            }

            // Log the download
            await DocumentAccessLog.logDownload(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent']
            );

            // Set headers for file download
            res.setHeader('Content-Type', document.file_mime_type);
            res.setHeader('Content-Disposition', `attachment; filename="${document.original_file_name}"`);
            res.setHeader('Content-Length', decryptedData.length);

            res.send(decryptedData);
        } catch (error) {
            console.error('Download document error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * View document inline (for images/PDFs)
     * GET /api/patient-documents/:id/view
     */
    static async viewDocument(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const document = await PatientDocument.getFileData(id);

            if (!document) {
                return next(new AppError('Document not found', 404));
            }

            if (document.is_deleted) {
                return next(new AppError('Document has been deleted', 410));
            }

            if (!document.file_data) {
                return next(new AppError('Document file data not available', 404));
            }

            // Decrypt file
            const decryptedData = decryptFile(document.file_data, document.encryption_iv);

            // Verify checksum
            if (!verifyChecksum(decryptedData, document.file_checksum)) {
                console.error('Checksum verification failed for document:', id);
                return next(new AppError('Document integrity check failed', 500));
            }

            // Log the view
            await DocumentAccessLog.logView(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent']
            );

            // Set headers for inline viewing
            res.setHeader('Content-Type', document.file_mime_type);
            res.setHeader('Content-Disposition', `inline; filename="${document.original_file_name}"`);
            res.setHeader('Content-Length', decryptedData.length);

            res.send(decryptedData);
        } catch (error) {
            console.error('View document error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Soft delete a document
     * DELETE /api/patient-documents/:id
     * Roles: NURSE, DOCTOR
     */
    static async deleteDocument(req, res, next) {
        try {
            const { id } = req.params;
            const { hard } = req.query;
            const userId = req.userId;
            const userRole = req.userRole || req.user?.role_code;

            const document = await PatientDocument.getMetadata(id);

            if (!document) {
                return next(new AppError('Document not found', 404));
            }

            // Hard delete - admin only
            if (hard === 'true') {
                if (!['SUPER_ADMIN', 'CLIENT_ADMIN'].includes(userRole)) {
                    return next(new AppError('Hard delete requires admin privileges', 403));
                }

                // Log before hard delete (preserve metadata)
                await DocumentAccessLog.logHardDelete(
                    document.document_id,
                    userId,
                    req.ip,
                    req.headers['user-agent'],
                    {
                        file_name: document.original_file_name,
                        document_type: document.document_type,
                        patient_id: document.patient_id,
                        file_size: document.file_size,
                        uploaded_by: document.uploaded_by,
                        created_at: document.created_at
                    }
                );

                await PatientDocument.hardDelete(id);

                return res.status(200).json({
                    status: 'success',
                    message: 'Document permanently deleted'
                });
            }

            // Soft delete
            await PatientDocument.softDelete(id, userId);

            // Log the delete
            await DocumentAccessLog.logDelete(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent']
            );

            res.status(200).json({
                status: 'success',
                message: 'Document deleted'
            });
        } catch (error) {
            console.error('Delete document error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Restore a soft-deleted document
     * POST /api/patient-documents/:id/restore
     * Roles: NURSE, DOCTOR, CLIENT_ADMIN
     */
    static async restoreDocument(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.userId;

            const document = await PatientDocument.getMetadata(id);

            if (!document) {
                return next(new AppError('Document not found', 404));
            }

            if (!document.is_deleted) {
                return next(new AppError('Document is not deleted', 400));
            }

            await PatientDocument.restore(id);

            // Log the restore
            await DocumentAccessLog.logRestore(
                document.document_id,
                userId,
                req.ip,
                req.headers['user-agent']
            );

            res.status(200).json({
                status: 'success',
                message: 'Document restored'
            });
        } catch (error) {
            console.error('Restore document error:', error);
            next(new AppError(error.message, 500));
        }
    }

    /**
     * Get access logs for a document
     * GET /api/patient-documents/:id/logs
     * Roles: CLIENT_ADMIN, SUPER_ADMIN
     */
    static async getDocumentLogs(req, res, next) {
        try {
            const { id } = req.params;

            const logs = await DocumentAccessLog.getLogsForDocument(id);

            res.status(200).json({
                status: 'success',
                data: { logs }
            });
        } catch (error) {
            console.error('Get document logs error:', error);
            next(new AppError(error.message, 500));
        }
    }
}

module.exports = PatientDocumentController;
