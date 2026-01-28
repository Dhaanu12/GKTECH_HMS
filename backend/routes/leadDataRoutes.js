const express = require('express');
const router = express.Router();
const LeadDataController = require('../controllers/leadDataController');
const { authenticate, authorize } = require('../middleware/auth');

// Protect all routes - restrict to admins
router.use(authenticate);
router.use(authorize('SUPER_ADMIN'));

router.get('/', LeadDataController.getAllLeadData);
router.get('/:id', LeadDataController.getLeadDataById);

module.exports = router;
