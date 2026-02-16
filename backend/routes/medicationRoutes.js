const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medicationController');
const { authenticate, authorize } = require('../middleware/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.get('/', medicationController.getAllMedications);
router.post('/toggle', medicationController.toggleBranchMedication);
router.post('/create', medicationController.createCustomMedication);
router.post('/upload', upload.single('file'), medicationController.uploadMedicationExcel);

module.exports = router;
