const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billingController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate); // All routes require authentication

// Create Bill (Pay Now)
router.post('/', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.createBill);

// Get Bills List
router.get('/', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.getBills);

// Get Pending Clearances (Grouped by OPD)
router.get('/pending-clearances', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.getPendingClearances);

// Get Bill By ID
router.get('/:id', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.getBillById);

// Get Pending Bill Items for OPD
router.get('/pending/:opd_id', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.getPendingBillItems);

// Cancel Bill Item
router.post('/cancel-item', authorize('RECEPTIONIST', 'ADMIN', 'ACCOUNTANT'), BillingController.cancelBillItem);

module.exports = router;
