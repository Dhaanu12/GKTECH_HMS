const express = require('express');
const router = express.Router();
const HospitalController = require('../controllers/hospitalController');
const { authenticate, authorize } = require('../middleware/auth');

const upload = require('../middleware/uploadMiddleware');

router.post('/', authenticate, authorize('SUPER_ADMIN'), upload.single('logo'), HospitalController.createHospital);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), HospitalController.getAllHospitals);
router.get('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), HospitalController.getHospitalById);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), upload.single('logo'), HospitalController.updateHospital);
router.patch('/:id/status', authenticate, authorize('SUPER_ADMIN'), HospitalController.toggleHospitalStatus);

module.exports = router;
