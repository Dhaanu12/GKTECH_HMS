/**
 * TemplateController
 * 
 * Handles prescription template operations with intelligent suggestion logic.
 */

const PrescriptionTemplate = require('../models/PrescriptionTemplate');
const PatientContextService = require('../services/PatientContextService');
const Doctor = require('../models/Doctor');
const { AppError } = require('../middleware/errorHandler');

class TemplateController {
    /**
     * Get all templates for the logged-in doctor
     * GET /api/templates
     */
    static async getTemplates(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { specialty } = req.query;

            // Get doctor_id from user_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            const templates = await PrescriptionTemplate.findAllForDoctor(
                doctor.doctor_id,
                specialty || doctor.specialization
            );

            res.status(200).json({
                status: 'success',
                results: templates.length,
                data: { templates }
            });
        } catch (error) {
            console.error('Get templates error:', error);
            next(new AppError('Failed to fetch templates', 500));
        }
    }

    /**
     * Suggest templates based on diagnosis with patient context analysis
     * GET /api/templates/suggest?diagnosis=&patient_id=&opd_id=
     */
    static async suggestTemplates(req, res, next) {
        try {
            const { diagnosis, patient_id, opd_id } = req.query;
            const userId = req.user.user_id;

            if (!diagnosis) {
                return next(new AppError('Diagnosis is required for suggestions', 400));
            }

            // Get doctor_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            // Get matching templates
            let templates = await PrescriptionTemplate.findByDiagnosis(
                diagnosis,
                doctor.doctor_id,
                doctor.specialization
            );

            // If patient_id provided, get patient context and analyze safety
            let patientContext = null;
            let safetyAnalysis = null;

            if (patient_id) {
                patientContext = await PatientContextService.getPatientContext(
                    parseInt(patient_id),
                    opd_id ? parseInt(opd_id) : null
                );

                if (patientContext) {
                    // Analyze each template's medications for safety
                    templates = templates.map(template => {
                        if (template.medications && template.medications.length > 0) {
                            const safety = PatientContextService.analyzeMedicationSafety(
                                template.medications,
                                patientContext
                            );

                            return {
                                ...template,
                                safeMedications: safety.safe,
                                excludedMedications: safety.excluded,
                                warnings: safety.warnings,
                                isSafe: safety.isSafeOverall
                            };
                        }
                        return {
                            ...template,
                            safeMedications: [],
                            excludedMedications: [],
                            warnings: [],
                            isSafe: true
                        };
                    });

                    // Sort: safe templates first, then by usage
                    templates.sort((a, b) => {
                        if (a.isSafe && !b.isSafe) return -1;
                        if (!a.isSafe && b.isSafe) return 1;
                        return (b.usage_count || 0) - (a.usage_count || 0);
                    });
                }
            }

            res.status(200).json({
                status: 'success',
                results: templates.length,
                data: {
                    templates,
                    patientContext: patientContext ? {
                        name: patientContext.name,
                        age: patientContext.bioData.age,
                        gender: patientContext.bioData.gender,
                        ageCategory: patientContext.bioData.ageCategory,
                        allergies: patientContext.allergies,
                        allergyRaw: patientContext.allergyRaw,
                        currentMedications: patientContext.currentMedications,
                        recentDiagnoses: patientContext.recentDiagnoses,
                        liveVitals: patientContext.liveVitals,
                        visitCount: patientContext.visitCount
                    } : null,
                    searchedDiagnosis: diagnosis
                }
            });
        } catch (error) {
            console.error('Suggest templates error:', error);
            next(new AppError('Failed to suggest templates', 500));
        }
    }

    /**
     * Get a single template by ID with all medications
     * GET /api/templates/:id
     */
    static async getTemplateById(req, res, next) {
        try {
            const { id } = req.params;

            const template = await PrescriptionTemplate.findByIdWithMedications(parseInt(id));

            if (!template) {
                return next(new AppError('Template not found', 404));
            }

            res.status(200).json({
                status: 'success',
                data: { template }
            });
        } catch (error) {
            console.error('Get template error:', error);
            next(new AppError('Failed to fetch template', 500));
        }
    }

    /**
     * Create a new template (personal for the doctor)
     * POST /api/templates
     */
    static async createTemplate(req, res, next) {
        try {
            const {
                name, diagnosis_name, diagnosis_keywords, description,
                specialty, medications
            } = req.body;
            const userId = req.user.user_id;
            const branch_id = req.user.branch_id;

            // Validation
            if (!name || !diagnosis_name) {
                return next(new AppError('Template name and diagnosis are required', 400));
            }
            if (!medications || medications.length === 0) {
                return next(new AppError('At least one medication is required', 400));
            }

            // Get doctor_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            const templateData = {
                name,
                diagnosis_name,
                diagnosis_keywords: diagnosis_keywords || [diagnosis_name.toLowerCase()],
                description,
                specialty: specialty || doctor.specialization,
                is_global: false, // Personal template
                doctor_id: doctor.doctor_id,
                branch_id
            };

            const template = await PrescriptionTemplate.createWithMedications(
                templateData,
                medications
            );

            res.status(201).json({
                status: 'success',
                message: 'Template created successfully',
                data: { template }
            });
        } catch (error) {
            console.error('Create template error:', error);
            next(new AppError('Failed to create template', 500));
        }
    }

    /**
     * Apply a template (track usage)
     * POST /api/templates/:id/apply
     */
    static async applyTemplate(req, res, next) {
        try {
            const { id } = req.params;
            const { patient_id, modifications } = req.body;
            const userId = req.user.user_id;

            // Get doctor_id
            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            // Get template with medications
            const template = await PrescriptionTemplate.findByIdWithMedications(parseInt(id));
            if (!template) {
                return next(new AppError('Template not found', 404));
            }

            // Track usage
            await PrescriptionTemplate.updateUsage(
                doctor.doctor_id,
                template.template_id,
                patient_id ? parseInt(patient_id) : null,
                modifications
            );

            res.status(200).json({
                status: 'success',
                message: 'Template applied successfully',
                data: {
                    template,
                    applied: true
                }
            });
        } catch (error) {
            console.error('Apply template error:', error);
            next(new AppError('Failed to apply template', 500));
        }
    }

    /**
     * Search drugs from medical_services for autocomplete
     * GET /api/templates/drugs/search?q=
     */
    static async searchDrugs(req, res, next) {
        try {
            const { q } = req.query;

            if (!q || q.length < 2) {
                return res.status(200).json({
                    status: 'success',
                    data: { drugs: [] }
                });
            }

            const drugs = await PrescriptionTemplate.searchDrugs(q);

            res.status(200).json({
                status: 'success',
                results: drugs.length,
                data: { drugs }
            });
        } catch (error) {
            console.error('Search drugs error:', error);
            next(new AppError('Failed to search drugs', 500));
        }
    }

    /**
     * Get doctor's top/favorite templates
     * GET /api/templates/favorites
     */
    static async getFavorites(req, res, next) {
        try {
            const userId = req.user.user_id;
            const { limit = 5 } = req.query;

            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            const templates = await PrescriptionTemplate.getTopTemplatesForDoctor(
                doctor.doctor_id,
                parseInt(limit)
            );

            res.status(200).json({
                status: 'success',
                results: templates.length,
                data: { templates }
            });
        } catch (error) {
            console.error('Get favorites error:', error);
            next(new AppError('Failed to fetch favorite templates', 500));
        }
    }

    /**
     * Delete a template (only own templates)
     * DELETE /api/templates/:id
     */
    static async deleteTemplate(req, res, next) {
        try {
            const { id } = req.params;
            const userId = req.user.user_id;

            const doctor = await Doctor.findOne({ user_id: userId });
            if (!doctor) {
                return next(new AppError('Doctor profile not found', 404));
            }

            // Check ownership
            const template = await PrescriptionTemplate.findById(parseInt(id));
            if (!template) {
                return next(new AppError('Template not found', 404));
            }

            if (template.is_global || template.doctor_id !== doctor.doctor_id) {
                return next(new AppError('You can only delete your own templates', 403));
            }

            await PrescriptionTemplate.delete(parseInt(id));

            res.status(200).json({
                status: 'success',
                message: 'Template deleted successfully'
            });
        } catch (error) {
            console.error('Delete template error:', error);
            next(new AppError('Failed to delete template', 500));
        }
    }
}

module.exports = TemplateController;
