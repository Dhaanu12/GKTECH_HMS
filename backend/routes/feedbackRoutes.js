const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedbackController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/feedback/stats/trends
 * Get feedback trends and statistics
 * Must be before /:id to avoid conflict
 */
router.get('/stats/trends', feedbackController.getFeedbackTrends);

/**
 * GET /api/feedback/export
 * Export feedback to CSV
 */
router.get('/export', feedbackController.exportFeedback);

/**
 * GET /api/feedback
 * Get all feedback with filtering and pagination
 * Query params: page, limit, sentiment, startDate, endDate, addressed, search
 */
router.get('/', feedbackController.getAllFeedback);

/**
 * GET /api/feedback/:id
 * Get single feedback by ID
 */
router.get('/:id', feedbackController.getFeedbackById);

/**
 * POST /api/feedback
 * Create new feedback
 */
router.post('/', feedbackController.createFeedback);

/**
 * PATCH /api/feedback/:id
 * Update feedback details
 */
router.patch('/:id', feedbackController.updateFeedback);

/**
 * PATCH /api/feedback/:id/address
 * Mark feedback as addressed with follow-up notes
 */
router.patch('/:id/address', feedbackController.addressFeedback);

/**
 * DELETE /api/feedback/:id
 * Delete feedback
 */
router.delete('/:id', feedbackController.deleteFeedback);

module.exports = router;
