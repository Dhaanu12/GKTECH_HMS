const express = require('express');
const router = express.Router();
const multer = require('multer');
const BillingSetupController = require('../controllers/BillingSetupController');
const { authenticate, authorize } = require('../middleware/auth'); // Assuming auth middleware exists

// Configure multer for Excel file uploads
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

// Search services (autocomplete)
// Search services (autocomplete)
router.get('/search-services', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), BillingSetupController.searchServices);
// router.get('/search-services', (req, res, next) => {
//     console.log(`[Diagnostic-Route] Hit /search-services with query:`, req.query);
//     next();
// }, BillingSetupController.searchServices);

// Create new billing setup
router.post('/create', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.createBillingSetup);
router.put('/update/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.updateBillingSetup);

// Get setups by branch
router.get('/branch/:branchId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.getBranchBillingSetups);

// Get branch services with pricing (for new table UI)
router.get('/branch/:branchId/services-with-pricing', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.getServicesWithPricing);

// Bulk update prices
router.put('/branch/:branchId/bulk-update', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.bulkUpdatePrices);

// Copy billing setups from one branch to another
router.post('/copy-from-branch', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.copyFromBranch);

// Excel import/export for billing configuration
router.get('/branch/:branchId/excel-download', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.downloadBillingExcel);
router.post('/branch/:branchId/excel-upload', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('file'), BillingSetupController.uploadBillingExcel);

// Delete billing setup
//router.delete('/delete/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.deleteBillingSetup);

module.exports = router;
