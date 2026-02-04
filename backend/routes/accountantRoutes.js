const express = require('express');
const router = express.Router();
const accountantController = require('../controllers/accountantController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Make sure this folder exists
    },
    filename: function (req, file, cb) {
        cb(null, 'claims-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.includes('sheet') || file.mimetype.includes('csv') || file.mimetype.includes('excel')) {
            cb(null, true);
        } else {
            cb(new Error('Only Excel or CSV files are allowed!'), false);
        }
    }
});

// Create uploads dir if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Routes
router.post('/upload-claims', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), upload.single('file'), accountantController.uploadClaims);
router.get('/claims', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), accountantController.getClaims);
router.get('/reports', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), accountantController.getReports);
router.get('/insurance-companies', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN'), accountantController.getInsuranceCompanies);
router.get('/claim/approval/:approvalNo', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getClaimByApprovalNo);
router.put('/claim/:id/payment', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.updateClaimPayment);

// Get Accountant's Assigned Branches
router.get('/assigned-branches', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getAssignedBranches);

// Dashboard Stats
router.get('/dashboard-stats', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getDashboardStats);

// Analytics Routes - ACCOUNTANT ONLY
router.get('/analytics/hospital-branch', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getHospitalBranchAnalytics);
router.get('/analytics/insurers', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getInsurerAnalytics);
router.get('/analytics/branch-insurers/:branch_id', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER'), accountantController.getBranchInsurerAnalytics);


// Admin Routes (Manage Accountants)
router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), accountantController.createAccountant);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), accountantController.getAllAccountants);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), accountantController.getAccountantById);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), accountantController.updateAccountant);

module.exports = router;
