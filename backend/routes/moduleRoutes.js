const express = require('express');
const router = express.Router();
const modulesController = require('../controllers/modules/modulesController');

const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('SUPER_ADMIN'), modulesController.createModule);
router.put('/:id', authenticate, authorize('SUPER_ADMIN'), modulesController.updateModule);
router.get('/', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), modulesController.getAllModules);
router.post('/assign', authenticate, authorize('SUPER_ADMIN'), modulesController.assignModuleToClient);
router.put('/client-modules/:id', authenticate, authorize('SUPER_ADMIN'), modulesController.updateClientModule);
router.get('/client/:client_id', authenticate, authorize('SUPER_ADMIN', 'CLIENT_ADMIN'), modulesController.getClientModules);

module.exports = router;
