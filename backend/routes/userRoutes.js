const express = require('express');
const router = express.Router();
const userManagmentController = require('../controllers/user/userManagementController');

// Middleware
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), userManagmentController.createUser);
router.put('/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), userManagmentController.updateUser);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), userManagmentController.getUsers);

module.exports = router;
