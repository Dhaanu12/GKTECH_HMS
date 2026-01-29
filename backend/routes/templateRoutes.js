/**
 * Template Routes
 * 
 * API endpoints for prescription templates
 */

const express = require('express');
const router = express.Router();
const TemplateController = require('../controllers/templateController');
const { authenticate, authorize } = require('../middleware/auth');

// All routes require authentication and DOCTOR role
router.use(authenticate);
router.use(authorize('DOCTOR'));

// GET /api/templates - Get all templates for current doctor
router.get('/', TemplateController.getTemplates);

// GET /api/templates/suggest - Suggest templates based on diagnosis
router.get('/suggest', TemplateController.suggestTemplates);

// GET /api/templates/favorites - Get doctor's favorite/top templates
router.get('/favorites', TemplateController.getFavorites);

// GET /api/templates/drugs/search - Search drugs from medical_services
router.get('/drugs/search', TemplateController.searchDrugs);

// GET /api/templates/:id - Get single template with medications
router.get('/:id', TemplateController.getTemplateById);

// POST /api/templates - Create new personal template
router.post('/', TemplateController.createTemplate);

// POST /api/templates/:id/apply - Apply template (track usage)
router.post('/:id/apply', TemplateController.applyTemplate);

// DELETE /api/templates/:id - Delete own template
router.delete('/:id', TemplateController.deleteTemplate);

module.exports = router;
