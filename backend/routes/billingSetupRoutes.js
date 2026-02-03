const express = require('express');
const router = express.Router();
const BillingSetupController = require('../controllers/BillingSetupController');
const { authenticate, authorize } = require('../middleware/auth'); // Assuming auth middleware exists

// Search services (autocomplete)
router.get('/search-services', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.searchServices);

// Create new billing setup
router.post('/create', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.createBillingSetup);
router.put('/update/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.updateBillingSetup);

// Get setups by branch
router.get('/branch/:branchId', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.getBranchBillingSetups);

// Get branch services with pricing (for new table UI)
router.get('/branch/:branchId/services-with-pricing', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.getServicesWithPricing);

// Bulk update prices
router.put('/branch/:branchId/bulk-update', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.bulkUpdatePrices);

// Copy billing setups from one branch to another
router.post('/copy-from-branch', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.copyFromBranch);

// Delete billing setup
//router.delete('/delete/:id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), BillingSetupController.deleteBillingSetup);

module.exports = router;
