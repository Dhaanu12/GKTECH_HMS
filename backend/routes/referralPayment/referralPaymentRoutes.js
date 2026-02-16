const express = require('express');
const router = express.Router();
const referralPaymentController = require('../../controllers/referralPayment/referralPaymentController');
const { authenticate, authorize } = require('../../middleware/auth');
const multer = require('multer');
const path = require('path');

// Multer setup for Excel upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, 'referral_upload_' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('excel') || file.mimetype.includes('spreadsheetml')) {
            cb(null, true);
        } else {
            cb(new Error('Please upload only Excel files.'), false);
        }
    }
});

// Routes
// 1. Download Template 
// RBAC: Accountant, Accounts Manager, Marketing Manager, COO ? 
// User said: "Accountant: upload bills...". So Accountant needs access.
router.get('/template', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'MRKT_MNGR', 'SUPER_ADMIN'), referralPaymentController.downloadTemplate);

// 2. Upload Data
router.post('/upload', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), upload.single('file'), referralPaymentController.uploadReferralData);

// 3. Reports
router.get('/reports', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'MRKT_EXEC', 'MRKT_MNGR', 'COO', 'SUPER_ADMIN'), referralPaymentController.getPaymentReports);

// 4. Agent Reports & Stats
router.get('/agent-reports', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'MRKT_EXEC', 'MRKT_MNGR', 'COO', 'SUPER_ADMIN'), referralPaymentController.getAgentReferralReports);
router.get('/agent-stats', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'MRKT_EXEC', 'MRKT_MNGR', 'COO', 'SUPER_ADMIN'), referralPaymentController.getAgentDashboardStats);

// 5. Recalculate Commission
router.put('/recalculate', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), referralPaymentController.recalculateCommission);

module.exports = router;
