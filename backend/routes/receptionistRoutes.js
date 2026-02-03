const express = require('express');
const router = express.Router();
const receptionistController = require('../controllers/receptionistController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

// GET /api/receptionists - Get all receptionists (Super Admin, Client Admin)
router.get('/', authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), receptionistController.getAllReceptionists);

// GET /api/receptionists/:id - Get receptionist by ID
router.get('/:id', authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), receptionistController.getReceptionistById);

// POST /api/receptionists - Create new receptionist
router.post('/', authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), receptionistController.createReceptionist);

// PUT /api/receptionists/:id - Update receptionist
router.put('/:id', authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), receptionistController.updateReceptionist);

// DELETE /api/receptionists/:id - Delete receptionist
router.delete('/:id', authorize('SUPER_ADMIN'), receptionistController.deleteReceptionist);

module.exports = router;
