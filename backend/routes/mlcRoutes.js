const express = require('express');
const router = express.Router();
const MlcController = require('../controllers/mlcController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

router.get('/opd/:opdId', authorize('DOCTOR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), MlcController.getMlcDetails);
router.post('/', authorize('DOCTOR', 'SUPER_ADMIN', 'CLIENT_ADMIN'), MlcController.createOrUpdateMlc);

module.exports = router;
