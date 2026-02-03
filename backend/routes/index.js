const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./authRoutes');
const hospitalRoutes = require('./hospitalRoutes');
const branchRoutes = require('./branchRoutes');
const departmentRoutes = require('./departmentRoutes');
const doctorRoutes = require('./doctorRoutes');
const nurseRoutes = require('./nurseRoutes');
const receptionistRoutes = require('./receptionistRoutes');
const clientAdminRoutes = require('./clientAdminRoutes');
const patientRoutes = require('./patientRoutes');
const appointmentRoutes = require('./appointmentRoutes');
const shiftRoutes = require('./shiftRoutes');
const opdRoutes = require('./opdRoutes');
const serviceRoutes = require('./serviceRoutes');
const referralRoutes = require('./referralRoutes');
const leadRoutes = require('./leadRoutes');
router.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'HMS API is running',
        timestamp: new Date().toISOString(),
    });
});

// API information endpoint
router.get('/', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'Welcome to Hospital Management System API',
        version: '1.0.0',
        endpoints: {
            health: '/api/health',
            auth: '/api/auth',
            hospitals: '/api/hospitals',
            branches: '/api/branches',
            departments: '/api/departments',
            doctors: '/api/doctors',
            nurses: '/api/nurses',
            receptionists: '/api/receptionists',
            clientadmins: '/api/clientadmins',
            patients: '/api/patients',
            appointments: '/api/appointments',
            opd: '/api/opd',
            shifts: '/api/shifts',
            labOrders: '/api/lab-orders',
            patientDocuments: '/api/patient-documents',
            vitals: '/api/vitals',
            clinicalNotes: '/api/clinical-notes',
        },
    });
});

// Mount route modules
router.use('/auth', authRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/branches', branchRoutes);
router.use('/departments', departmentRoutes);
router.use('/doctors', doctorRoutes);
router.use('/nurses', nurseRoutes);
router.use('/receptionists', receptionistRoutes);
router.use('/clientadmins', clientAdminRoutes);
router.use('/patients', patientRoutes);
router.use('/shifts', shiftRoutes);
router.use('/opd', opdRoutes);
router.use('/services', serviceRoutes);
router.use('/referrals', referralRoutes);
router.use('/appointments', require('./appointmentRoutes'));
router.use('/prescriptions', require('./prescriptionRoutes'));
router.use('/consultations', require('./consultationRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/accountant', require('./accountantRoutes'));
router.use('/mlc', require('./mlcRoutes'));
router.use('/marketing', require('./marketingRoutes'));
router.use('/modules', require('./moduleRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/referral-payment', require('./referralPayment/referralPaymentRoutes'));
router.use('/lead-data', require('./leadDataRoutes'));
router.use('/leads', leadRoutes);
router.use('/feedback', require('./feedbackRoutes'));
router.use('/lab-orders', require('./labOrderRoutes'));
router.use('/patient-documents', require('./patientDocumentRoutes'));
router.use('/vitals', require('./vitalsRoutes'));
router.use('/clinical-notes', require('./clinicalNotesRoutes'));

module.exports = router;
