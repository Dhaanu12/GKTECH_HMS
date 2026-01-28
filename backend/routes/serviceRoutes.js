const express = require('express');
const router = express.Router();
const ServiceController = require('../controllers/serviceController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ServiceController.getAllServices);

module.exports = router;
