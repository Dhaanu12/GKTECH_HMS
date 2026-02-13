const express = require('express');
const router = express.Router();
const referralDoctorController = require('../controllers/marketing/referralDoctorController');
const referralPatientController = require('../controllers/marketing/referralPatientController');
const accountsController = require('../controllers/marketing/accountsController');
const dashboardController = require('../controllers/marketing/dashboardController');
const marketingTeamController = require('../controllers/marketing/marketingTeamController');
const { authenticate, authorize } = require('../middleware/auth');

// Dashboard Stats
router.get('/dashboard-stats', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), dashboardController.getDashboardStats);

// Marketing Team Routes (for managers)
router.get('/team-executives', authenticate, authorize('MRKT_MNGR'), marketingTeamController.getTeamExecutives);
router.get('/executive-stats/:executive_id', authenticate, authorize('MRKT_MNGR'), marketingTeamController.getExecutiveStats);

// Multer setup for file uploads
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directory exists
const uploadDir = 'uploads/marketing/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware


// Referral Doctor Routes
// Referral Doctor Routes
// Handle multiple file fields
const doctorUploads = upload.fields([
    { name: 'photo', maxCount: 1 },
    { name: 'pan', maxCount: 1 },
    { name: 'aadhar', maxCount: 1 },
    { name: 'clinic_photo', maxCount: 1 },
    { name: 'kyc_document', maxCount: 1 }
]);

router.post('/referral-doctors', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), doctorUploads, referralDoctorController.createReferralDoctor);
router.put('/referral-doctors/:id', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), doctorUploads, referralDoctorController.updateReferralDoctor);
console.log('Registering route: GET /referral-doctors/:id');
router.get('/referral-doctors/:id', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), (req, res, next) => {
    console.log('Route /referral-doctors/:id matches!');
    next();
}, referralDoctorController.getReferralDoctorById);
router.get('/referral-doctors', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), referralDoctorController.getAllReferralDoctors);

// Referral Agent Routes
const referralAgentController = require('../controllers/marketing/referralAgentController');
const agentUploads = upload.fields([{ name: 'pan', maxCount: 1 }]);
router.post('/referral-agents', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), agentUploads, referralAgentController.createReferralAgent);
// Reordered routes to prevent ID collision
router.put('/referral-agents/bulk', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), referralAgentController.bulkUpdateReferralAgents);
router.put('/referral-agents/:id', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), agentUploads, referralAgentController.updateReferralAgent);
router.delete('/referral-agents/:id', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), referralAgentController.deleteReferralAgent);
router.get('/referral-agents', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), referralAgentController.getAllReferralAgents);

// Referral Patient Routes
router.post('/referral-patients', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), referralPatientController.createReferralPatient);
router.get('/referral-patients', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), referralPatientController.getAllReferralPatients);

// Accounts Routes
router.post('/referral-doctors/percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.upsertServicePercentage);
router.get('/referral-doctors/:referral_doctor_id/percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'MRKT_EXEC', 'MRKT_MNGR'), accountsController.getPercentagesByDoctor);

// New Accounts/GST Routes
router.get('/referral-doctors-with-percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.getAllReferralDoctorsWithPercentages);
router.get('/hospital-services', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'MRKT_EXEC', 'MRKT_MNGR'), accountsController.getHospitalServices);
router.post('/calculate-gst', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.calculateGST);
router.put('/service-gst/:hosp_service_id', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.updateServiceGSTRate);
router.get('/referral-summary', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.getReferralSummary);

// Payment Management Routes
router.post('/payment-records', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.savePaymentRecord);
router.get('/payment-history', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.getPaymentHistory);
router.put('/payment-status/:payment_id', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), accountsController.updatePaymentStatus);

// Bulk Operations Routes
const bulkAccountsController = require('../controllers/marketing/bulkAccountsController');
router.post('/bulk-service-percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.bulkInsertServicePercentages);
router.post('/copy-service-percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.copyServicePercentages);
router.get('/doctors-without-percentages', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.getDoctorsWithoutPercentages);
router.get('/export-csv-template', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.exportCSVTemplate);
router.post('/import-csv', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.importCSV);
router.get('/export-doctor-configs', authenticate, authorize('ACCOUNTANT', 'ACCOUNTANT_MANAGER', 'SUPER_ADMIN', 'CLIENT_ADMIN'), bulkAccountsController.exportDoctorConfigs);

module.exports = router;
