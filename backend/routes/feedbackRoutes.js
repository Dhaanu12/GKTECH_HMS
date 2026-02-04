const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, feedbackController.createFeedback);
router.get('/', authenticate, feedbackController.getAllFeedback);

module.exports = router;
