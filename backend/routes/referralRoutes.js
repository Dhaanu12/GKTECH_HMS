const express = require('express');
const router = express.Router();
const ReferralController = require('../controllers/referralController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);


// Referral Hospitals
router.post('/hospitals', ReferralController.createReferralHospital);
router.get('/hospitals', ReferralController.getReferralHospitals);
router.patch('/hospitals/:id', ReferralController.updateReferralHospital);
router.delete('/hospitals/:id', ReferralController.deleteReferralHospital);

// Referral Doctors
router.post('/doctors', ReferralController.createReferralDoctor);
router.get('/doctors', ReferralController.getReferralDoctors);
router.patch('/doctors/:id', ReferralController.updateReferralDoctor);
router.delete('/doctors/:id', ReferralController.deleteReferralDoctor);

// Hospital Mapping
router.post('/mappings', ReferralController.createMapping);
router.delete('/mappings/:id', ReferralController.deleteMapping);

module.exports = router;
