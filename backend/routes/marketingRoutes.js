const express = require('express');
const router = express.Router();
const referralDoctorController = require('../controllers/marketing/referralDoctorController');
const referralPatientController = require('../controllers/marketing/referralPatientController');
const accountsController = require('../controllers/marketing/accountsController');

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
const { authenticate, authorize } = require('../middleware/auth');

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
router.get('/referral-doctors', authenticate, authorize('MRKT_EXEC', 'MRKT_MNGR', 'SUPER_ADMIN', 'CLIENT_ADMIN', 'ACCOUNTANT', 'ACCOUNTANT_MANAGER'), referralDoctorController.getAllReferralDoctors);

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

module.exports = router;
