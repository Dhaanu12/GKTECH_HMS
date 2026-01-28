const express = require('express');
const router = express.Router();
const PrescriptionController = require('../controllers/prescriptionController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.post('/', authorize('DOCTOR'), PrescriptionController.createPrescription);
router.get('/my-prescriptions', authorize('DOCTOR'), PrescriptionController.getMyPrescriptions);

module.exports = router;
