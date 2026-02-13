const express = require('express');
const router = express.Router();
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only Excel files are allowed.'));
        }
    }
});
const MedicalServicesController = require('../controllers/MedicalServicesController');
const { authenticate, authorize } = require('../middleware/auth');

// Get all services with pagination and filtering
router.get('/', authenticate, MedicalServicesController.getAllServices);

// Get service categories
router.get('/categories', authenticate, MedicalServicesController.getCategories);

// Hospital services
router.get('/hospital/:hospitalId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.getHospitalServices);
router.post('/hospital/:hospitalId/assign', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.assignHospitalServices);

// Branch services
router.get('/branch/:branchId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.getBranchServices);
router.post('/branch/:branchId/assign', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.assignBranchServices);

// Branch Excel operations
router.get('/branch/:branchId/excel-download', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.downloadBranchServicesExcel);
router.post('/branch/:branchId/excel-upload', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('file'), MedicalServicesController.uploadBranchServicesExcel);

// Hospital Excel operations
router.get('/hospital/:hospitalId/excel-download', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), MedicalServicesController.downloadHospitalServicesExcel);
router.post('/hospital/:hospitalId/excel-upload', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('file'), MedicalServicesController.uploadHospitalServicesExcel);

module.exports = router;
